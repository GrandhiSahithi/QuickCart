package com.quickcart.dto;

import java.util.List;

public record AdminOfferResponse(
        Long storeId,
        String storeName,
        String vertical,
        List<String> offers
) {
}
