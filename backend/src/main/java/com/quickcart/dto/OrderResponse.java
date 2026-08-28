package com.quickcart.dto;

import com.quickcart.model.Order;
import com.quickcart.model.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        Long storeId,
        String storeName,
        OrderStatus status,
        BigDecimal totalAmount,
        BigDecimal deliveryFee,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        Double storeLat,
        Double storeLng,
        Double destLat,
        Double destLng,
        Double currentLat,
        Double currentLng,
        Instant createdAt,
        List<OrderItemResponse> items
) {
    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getStore().getId(),
                order.getStore().getName(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getDeliveryFee(),
                order.getSubtotal(),
                order.getDiscountAmount(),
                order.getStoreLat(),
                order.getStoreLng(),
                order.getDestLat(),
                order.getDestLng(),
                order.getCurrentLat(),
                order.getCurrentLng(),
                order.getCreatedAt(),
                order.getItems().stream().map(OrderItemResponse::from).toList()
        );
    }
}
