package com.quickcart.dto;

import com.quickcart.model.Order;
import com.quickcart.model.OrderStatus;

import java.time.Instant;

public record TrackingResponse(
        Long id,
        OrderStatus status,
        Double storeLat,
        Double storeLng,
        Double destLat,
        Double destLng,
        Double currentLat,
        Double currentLng,
        Instant statusChangedAt
) {
    public static TrackingResponse from(Order order) {
        return new TrackingResponse(
                order.getId(),
                order.getStatus(),
                order.getStoreLat(),
                order.getStoreLng(),
                order.getDestLat(),
                order.getDestLng(),
                order.getCurrentLat(),
                order.getCurrentLng(),
                order.getStatusChangedAt()
        );
    }
}
