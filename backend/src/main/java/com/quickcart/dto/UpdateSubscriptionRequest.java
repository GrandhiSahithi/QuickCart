package com.quickcart.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateSubscriptionRequest(
        @NotNull Boolean active
) {
}
