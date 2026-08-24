package com.quickcart.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderRequest(
        @NotNull Long storeId,
        @NotEmpty List<OrderItemRequest> items,
        Double lat,
        Double lng
) {
}
