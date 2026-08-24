package com.quickcart.service;

import com.quickcart.dto.AdminStatsResponse;
import com.quickcart.model.Order;
import com.quickcart.model.OrderItem;
import com.quickcart.model.Store;
import com.quickcart.repository.OrderRepository;
import com.quickcart.repository.StoreRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    public AdminService(OrderRepository orderRepository, StoreRepository storeRepository) {
        this.orderRepository = orderRepository;
        this.storeRepository = storeRepository;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public AdminStatsResponse getStats() {
        List<Order> orders = orderRepository.findAll();

        BigDecimal totalRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgOrderValue = orders.isEmpty()
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);

        Map<String, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getStatus().name(), LinkedHashMap::new, Collectors.counting()));

        Map<String, long[]> productQty = new LinkedHashMap<>();
        Map<String, BigDecimal> productRevenue = new LinkedHashMap<>();
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                productQty.merge(item.getProductName(), new long[]{item.getQuantity()},
                        (a, b) -> new long[]{a[0] + b[0]});
                productRevenue.merge(item.getProductName(), item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())), BigDecimal::add);
            }
        }

        List<AdminStatsResponse.TopEntry> topProducts = productQty.entrySet().stream()
                .map(e -> new AdminStatsResponse.TopEntry(e.getKey(), e.getValue()[0], productRevenue.get(e.getKey())))
                .sorted(Comparator.comparingLong(AdminStatsResponse.TopEntry::count).reversed())
                .limit(5)
                .toList();

        Map<String, Long> storeOrderCount = new LinkedHashMap<>();
        Map<String, BigDecimal> storeRevenue = new LinkedHashMap<>();
        for (Order order : orders) {
            String storeName = order.getStore().getName();
            storeOrderCount.merge(storeName, 1L, Long::sum);
            storeRevenue.merge(storeName, order.getTotalAmount(), BigDecimal::add);
        }

        List<AdminStatsResponse.TopEntry> topStores = storeOrderCount.entrySet().stream()
                .map(e -> new AdminStatsResponse.TopEntry(e.getKey(), e.getValue(), storeRevenue.get(e.getKey())))
                .sorted(Comparator.comparing(AdminStatsResponse.TopEntry::revenue).reversed())
                .limit(5)
                .toList();

        return new AdminStatsResponse(orders.size(), totalRevenue, avgOrderValue, ordersByStatus, topProducts, topStores);
    }
}
