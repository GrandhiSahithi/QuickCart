package com.quickcart.dto;

import com.quickcart.model.Store;
import com.quickcart.model.Vertical;
import com.quickcart.util.GeoUtil;

public record StoreResponse(
        Long id,
        String name,
        Vertical vertical,
        String imageUrl,
        Double rating,
        Integer etaMinutes,
        Double lat,
        Double lng,
        Integer deliveryFeeDiscountPercent
) {
    public static StoreResponse from(Store store, Double viewerLat, Double viewerLng) {
        return new StoreResponse(
                store.getId(),
                store.getName(),
                store.getVertical(),
                store.getImageUrl(),
                store.getRating(),
                store.getEtaMinutes(),
                GeoUtil.translateLat(store.getLat(), viewerLat),
                GeoUtil.translateLng(store.getLng(), viewerLng),
                store.getDeliveryFeeDiscountPercent()
        );
    }
}
