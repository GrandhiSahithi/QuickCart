package com.quickcart.dto;

import com.quickcart.model.Order;
import com.quickcart.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminOrderResponse(
        Long id,
        String customerName,
        String customerEmail,
        String storeName,
        OrderStatus status,
        BigDecimal totalAmount,
        Instant createdAt
) {
    public static AdminOrderResponse from(Order order) {
        return new AdminOrderResponse(
                order.getId(),
                order.getUser().getName(),
                order.getUser().getEmail(),
                order.getStore().getName(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCreatedAt()
        );
    }
}
