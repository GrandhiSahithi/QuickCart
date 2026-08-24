package com.quickcart.controller;

import com.quickcart.dto.OrderRequest;
import com.quickcart.dto.OrderResponse;
import com.quickcart.dto.TrackingResponse;
import com.quickcart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse createOrder(Authentication auth, @Valid @RequestBody OrderRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return OrderResponse.from(orderService.createOrder(userId, request));
    }

    @GetMapping("/mine")
    public List<OrderResponse> myOrders(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return orderService.getOrdersForUser(userId).stream().map(OrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return OrderResponse.from(orderService.getOrder(id, userId));
    }

    @GetMapping("/{id}/tracking")
    public TrackingResponse getTracking(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return TrackingResponse.from(orderService.getOrder(id, userId));
    }
}
