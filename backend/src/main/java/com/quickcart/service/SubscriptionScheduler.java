package com.quickcart.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionScheduler {

    private final SubscriptionService subscriptionService;

    public SubscriptionScheduler(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Scheduled(fixedRate = 60000)
    public void tick() {
        subscriptionService.processDue();
    }
}
