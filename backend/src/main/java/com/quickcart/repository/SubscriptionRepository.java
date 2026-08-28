package com.quickcart.repository;

import com.quickcart.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Subscription> findByActiveTrueAndNextDeliveryDateBefore(Instant cutoff);
}
