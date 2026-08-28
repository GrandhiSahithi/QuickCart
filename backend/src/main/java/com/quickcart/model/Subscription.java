package com.quickcart.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

// "Never run out" auto-restock: a saved product + quantity that reorders
// itself on a timer instead of the customer having to remember to reorder.
@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private int intervalMinutes;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private Instant nextDeliveryDate;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
