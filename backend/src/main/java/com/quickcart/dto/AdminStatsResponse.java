package com.quickcart.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AdminStatsResponse(
        long totalOrders,
        BigDecimal totalRevenue,
        BigDecimal avgOrderValue,
        Map<String, Long> ordersByStatus,
        List<TopEntry> topProducts,
        List<TopEntry> topStores,
        long totalCustomers,
        long premiumCustomers,
        long newCustomersLast7Days,
        BigDecimal promoDiscountGiven,
        Map<String, BigDecimal> revenueByVertical,
        List<AdminOfferResponse> activeOffers
) {
    public record TopEntry(String name, long count, BigDecimal revenue) {
    }
}
