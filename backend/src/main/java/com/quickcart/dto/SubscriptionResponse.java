package com.quickcart.dto;

import com.quickcart.model.Subscription;

import java.math.BigDecimal;
import java.time.Instant;

public record SubscriptionResponse(
        Long id,
        Long productId,
        String productName,
        String productImageUrl,
        BigDecimal productPrice,
        Long storeId,
        String storeName,
        int quantity,
        int intervalMinutes,
        boolean active,
        Instant nextDeliveryDate,
        Instant createdAt
) {
    public static SubscriptionResponse from(Subscription sub) {
        return new SubscriptionResponse(
                sub.getId(),
                sub.getProduct().getId(),
                sub.getProduct().getName(),
                sub.getProduct().getImageUrl(),
                sub.getProduct().getPrice(),
                sub.getStore().getId(),
                sub.getStore().getName(),
                sub.getQuantity(),
                sub.getIntervalMinutes(),
                sub.isActive(),
                sub.getNextDeliveryDate(),
                sub.getCreatedAt()
        );
    }
}
