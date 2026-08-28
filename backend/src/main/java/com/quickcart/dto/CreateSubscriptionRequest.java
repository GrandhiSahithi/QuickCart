package com.quickcart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateSubscriptionRequest(
        @NotNull Long productId,
        @Min(1) int quantity,
        @Min(1) int intervalMinutes
) {
}
