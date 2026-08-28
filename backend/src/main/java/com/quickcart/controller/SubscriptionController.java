package com.quickcart.controller;

import com.quickcart.dto.CreateSubscriptionRequest;
import com.quickcart.dto.SubscriptionResponse;
import com.quickcart.dto.UpdateSubscriptionRequest;
import com.quickcart.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    public SubscriptionResponse create(Authentication auth, @Valid @RequestBody CreateSubscriptionRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return subscriptionService.create(userId, request);
    }

    @GetMapping("/mine")
    public List<SubscriptionResponse> mine(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return subscriptionService.listMine(userId);
    }

    @PatchMapping("/{id}")
    public SubscriptionResponse setActive(Authentication auth, @PathVariable Long id, @Valid @RequestBody UpdateSubscriptionRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return subscriptionService.setActive(userId, id, request.active());
    }

    @DeleteMapping("/{id}")
    public void cancel(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        subscriptionService.cancel(userId, id);
    }
}
