package com.quickcart.service;

import com.quickcart.dto.AdminCustomerResponse;
import com.quickcart.dto.AdminOfferResponse;
import com.quickcart.dto.AdminPasswordResetResponse;
import com.quickcart.dto.AdminStatsResponse;
import com.quickcart.model.Order;
import com.quickcart.model.OrderItem;
import com.quickcart.model.Product;
import com.quickcart.model.Store;
import com.quickcart.model.User;
import com.quickcart.repository.OrderRepository;
import com.quickcart.repository.ProductRepository;
import com.quickcart.repository.StoreRepository;
import com.quickcart.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    // Excludes visually ambiguous characters (0/O, 1/l/I) so a temp password
    // read aloud or copied by hand doesn't cause avoidable login failures.
    private static final String TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            OrderRepository orderRepository,
            StoreRepository storeRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.orderRepository = orderRepository;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public List<AdminCustomerResponse> getAllCustomers() {
        List<Order> orders = orderRepository.findAll();

        Map<Long, Long> orderCountByUser = new LinkedHashMap<>();
        Map<Long, BigDecimal> spendByUser = new LinkedHashMap<>();
        for (Order order : orders) {
            Long userId = order.getUser().getId();
            orderCountByUser.merge(userId, 1L, Long::sum);
            spendByUser.merge(userId, order.getTotalAmount(), BigDecimal::add);
        }

        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt).reversed())
                .map(user -> AdminCustomerResponse.from(
                        user,
                        orderCountByUser.getOrDefault(user.getId(), 0L),
                        spendByUser.getOrDefault(user.getId(), BigDecimal.ZERO)
                ))
                .toList();
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

        List<User> users = userRepository.findAll();
        long premiumCustomers = users.stream().filter(User::isPremium).count();
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long newCustomersLast7Days = users.stream().filter(u -> u.getCreatedAt().isAfter(sevenDaysAgo)).count();

        BigDecimal promoDiscountGiven = orders.stream()
                .map(Order::getDiscountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> revenueByVertical = new LinkedHashMap<>();
        for (Order order : orders) {
            String vertical = order.getStore().getVertical().name();
            revenueByVertical.merge(vertical, order.getTotalAmount(), BigDecimal::add);
        }

        return new AdminStatsResponse(
                orders.size(),
                totalRevenue,
                avgOrderValue,
                ordersByStatus,
                topProducts,
                topStores,
                users.size(),
                premiumCustomers,
                newCustomersLast7Days,
                promoDiscountGiven,
                revenueByVertical,
                getActiveOffers()
        );
    }

    // A store "has an offer" if it has a delivery discount, or carries at
    // least one SALE/BOGO product - stores with neither are left out rather
    // than listed with an empty offers array.
    private List<AdminOfferResponse> getActiveOffers() {
        Map<Long, List<Product>> productsByStore = productRepository.findAll().stream()
                .collect(Collectors.groupingBy(p -> p.getStore().getId()));

        List<AdminOfferResponse> offers = new ArrayList<>();
        for (Store store : storeRepository.findAll()) {
            List<Product> products = productsByStore.getOrDefault(store.getId(), List.of());
            long saleCount = products.stream().filter(p -> "SALE".equals(p.getBadge())).count();
            long bogoCount = products.stream().filter(p -> "BOGO".equals(p.getBadge())).count();

            List<String> storeOffers = new ArrayList<>();
            if (saleCount > 0) storeOffers.add(saleCount + " item" + (saleCount == 1 ? "" : "s") + " on sale");
            if (bogoCount > 0) storeOffers.add(bogoCount + " Buy 1 Get 1 item" + (bogoCount == 1 ? "" : "s"));
            if (store.getDeliveryFeeDiscountPercent() != null && store.getDeliveryFeeDiscountPercent() > 0) {
                storeOffers.add(store.getDeliveryFeeDiscountPercent() + "% off delivery");
            }

            if (!storeOffers.isEmpty()) {
                offers.add(new AdminOfferResponse(store.getId(), store.getName(), store.getVertical().name(), storeOffers));
            }
        }
        return offers;
    }

    // Generates a fresh temporary password and overwrites the account's hash
    // with it. The plain value is returned to the caller exactly once here -
    // it is never logged or persisted anywhere, and the original password is
    // never recoverable since only its hash was ever stored.
    public AdminPasswordResetResponse resetCustomerPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found"));

        String temporaryPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        userRepository.save(user);

        return new AdminPasswordResetResponse(user.getId(), user.getEmail(), temporaryPassword);
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return sb.toString();
    }
}
