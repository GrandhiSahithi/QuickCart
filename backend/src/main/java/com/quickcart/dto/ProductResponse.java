package com.quickcart.dto;

import com.quickcart.model.Product;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        Long storeId,
        String name,
        String description,
        String category,
        BigDecimal price,
        String imageUrl,
        Integer stock,
        String badge,
        BigDecimal originalPrice
) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getStore().getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getPrice(),
                product.getImageUrl(),
                product.getStock(),
                product.getBadge(),
                product.getOriginalPrice()
        );
    }
}
