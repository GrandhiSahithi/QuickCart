package com.quickcart.service;

import com.quickcart.dto.OrderItemRequest;
import com.quickcart.dto.OrderRequest;
import com.quickcart.model.*;
import com.quickcart.repository.OrderRepository;
import com.quickcart.repository.ProductRepository;
import com.quickcart.repository.UserRepository;
import com.quickcart.util.GeoUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    public static final BigDecimal DELIVERY_FEE = new BigDecimal("2.99");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StoreService storeService;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                         UserRepository userRepository, StoreService storeService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.storeService = storeService;
    }

    @Transactional
    public Order createOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        Store store = storeService.getStore(request.storeId());

        // If the viewer has a real location (from a ZIP geocode or their
        // device GPS), the store's position is re-anchored there so the
        // order and its tracking map sit somewhere real instead of always
        // the fixed demo city.
        double effectiveStoreLat = GeoUtil.translateLat(store.getLat(), request.lat());
        double effectiveStoreLng = GeoUtil.translateLng(store.getLng(), request.lng());

        Order order = new Order();
        order.setUser(user);
        order.setStore(store);
        order.setStatus(OrderStatus.PLACED);
        order.setStoreLat(effectiveStoreLat);
        order.setStoreLng(effectiveStoreLng);

        // Demo delivery point: a random spot 1-3km from the store, since there's
        // no real courier/address geocoding behind this.
        double angle = Math.random() * 2 * Math.PI;
        double distanceDeg = 0.01 + Math.random() * 0.02;
        order.setDestLat(effectiveStoreLat + Math.sin(angle) * distanceDeg);
        order.setDestLng(effectiveStoreLng + Math.cos(angle) * distanceDeg);
        order.setCurrentLat(effectiveStoreLat);
        order.setCurrentLng(effectiveStoreLng);

        // First order ever for this user gets 50% off - checked before this
        // order is saved, so it only ever fires once per customer.
        boolean isFirstOrder = orderRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setPrice(product.getPrice());
            item.setQuantity(itemRequest.quantity());
            order.getItems().add(item);

            // BOGO products only bill for half the quantity (rounded up), so
            // e.g. 3 units bills as 2.
            int quantity = itemRequest.quantity();
            int billableQuantity = "BOGO".equals(product.getBadge()) ? (quantity + 1) / 2 : quantity;
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(billableQuantity)));
        }

        BigDecimal discount = isFirstOrder
                ? subtotal.multiply(new BigDecimal("0.50")).setScale(2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal deliveryFee;
        if (user.isPremium()) {
            deliveryFee = BigDecimal.ZERO;
        } else {
            Integer discountPercent = store.getDeliveryFeeDiscountPercent();
            if (discountPercent != null && discountPercent > 0) {
                BigDecimal factor = BigDecimal.ONE.subtract(BigDecimal.valueOf(discountPercent).divide(new BigDecimal("100")));
                deliveryFee = DELIVERY_FEE.multiply(factor).setScale(2, java.math.RoundingMode.HALF_UP);
            } else {
                deliveryFee = DELIVERY_FEE;
            }
        }

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discount);
        order.setDeliveryFee(deliveryFee);
        order.setTotalAmount(subtotal.subtract(discount).add(deliveryFee));

        return orderRepository.save(order);
    }

    public List<Order> getOrdersForUser(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Order getOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found");
        }

        return order;
    }
}
