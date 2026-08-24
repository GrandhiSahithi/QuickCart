package com.quickcart.service;

import com.quickcart.model.Order;
import com.quickcart.model.OrderStatus;
import com.quickcart.repository.OrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Auto-advances every active order through its lifecycle on a timer and,
 * while OUT_FOR_DELIVERY, interpolates a lat/lng between the store and the
 * demo delivery point so the frontend has something real to poll and animate.
 * There is no real courier behind this - it's what makes the checkout flow
 * feel like a live delivery without any real payment or restaurant.
 */
@Service
public class DeliverySimulationService {

    private static final List<OrderStatus> TERMINAL = List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED);

    private static final Map<OrderStatus, Duration> STAGE_DURATION = Map.of(
            OrderStatus.PLACED, Duration.ofSeconds(4),
            OrderStatus.CONFIRMED, Duration.ofSeconds(4),
            OrderStatus.PREPARING, Duration.ofSeconds(10),
            OrderStatus.OUT_FOR_DELIVERY, Duration.ofSeconds(70)
    );

    private static final Map<OrderStatus, OrderStatus> NEXT_STATUS = Map.of(
            OrderStatus.PLACED, OrderStatus.CONFIRMED,
            OrderStatus.CONFIRMED, OrderStatus.PREPARING,
            OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED
    );

    private final OrderRepository orderRepository;

    public DeliverySimulationService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Scheduled(fixedRate = 2000)
    @Transactional
    public void tick() {
        List<Order> activeOrders = orderRepository.findByStatusNotIn(TERMINAL);
        Instant now = Instant.now();

        for (Order order : activeOrders) {
            advance(order, now);
        }
    }

    private void advance(Order order, Instant now) {
        Duration stageDuration = STAGE_DURATION.get(order.getStatus());
        Duration elapsed = Duration.between(order.getStatusChangedAt(), now);

        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY) {
            double progress = Math.min(1.0, elapsed.toMillis() / (double) stageDuration.toMillis());
            order.setCurrentLat(lerp(order.getStoreLat(), order.getDestLat(), progress));
            order.setCurrentLng(lerp(order.getStoreLng(), order.getDestLng(), progress));
        }

        if (elapsed.compareTo(stageDuration) >= 0) {
            OrderStatus next = NEXT_STATUS.get(order.getStatus());
            order.setStatus(next);
            order.setStatusChangedAt(now);

            if (next == OrderStatus.DELIVERED) {
                order.setCurrentLat(order.getDestLat());
                order.setCurrentLng(order.getDestLng());
            }
        }

        orderRepository.save(order);
    }

    private double lerp(double start, double end, double progress) {
        return start + (end - start) * progress;
    }
}
