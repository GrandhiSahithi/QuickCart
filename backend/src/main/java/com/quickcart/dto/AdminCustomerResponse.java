package com.quickcart.dto;

import com.quickcart.model.User;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminCustomerResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean premium,
        Instant createdAt,
        long orderCount,
        BigDecimal totalSpent
) {
    public static AdminCustomerResponse from(User user, long orderCount, BigDecimal totalSpent) {
        return new AdminCustomerResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isPremium(),
                user.getCreatedAt(),
                orderCount,
                totalSpent
        );
    }
}
