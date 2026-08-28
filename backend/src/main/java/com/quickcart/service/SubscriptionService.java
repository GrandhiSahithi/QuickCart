package com.quickcart.service;

import com.quickcart.dto.CreateSubscriptionRequest;
import com.quickcart.dto.OrderItemRequest;
import com.quickcart.dto.OrderRequest;
import com.quickcart.dto.SubscriptionResponse;
import com.quickcart.model.Product;
import com.quickcart.model.Subscription;
import com.quickcart.model.User;
import com.quickcart.repository.ProductRepository;
import com.quickcart.repository.SubscriptionRepository;
import com.quickcart.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;

    public SubscriptionService(
            SubscriptionRepository subscriptionRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            OrderService orderService
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
    }

    public SubscriptionResponse create(Long userId, CreateSubscriptionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        Subscription sub = new Subscription();
        sub.setUser(user);
        sub.setProduct(product);
        sub.setStore(product.getStore());
        sub.setQuantity(request.quantity());
        sub.setIntervalMinutes(request.intervalMinutes());
        sub.setNextDeliveryDate(Instant.now().plus(request.intervalMinutes(), ChronoUnit.MINUTES));

        return SubscriptionResponse.from(subscriptionRepository.save(sub));
    }

    public List<SubscriptionResponse> listMine(Long userId) {
        return subscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(SubscriptionResponse::from)
                .toList();
    }

    public SubscriptionResponse setActive(Long userId, Long subscriptionId, boolean active) {
        Subscription sub = findOwned(userId, subscriptionId);
        sub.setActive(active);

        // Resuming from pause pushes the next delivery out a fresh interval
        // from right now, rather than firing immediately off whatever date
        // was left over from before it was paused.
        if (active) {
            sub.setNextDeliveryDate(Instant.now().plus(sub.getIntervalMinutes(), ChronoUnit.MINUTES));
        }

        return SubscriptionResponse.from(subscriptionRepository.save(sub));
    }

    public void cancel(Long userId, Long subscriptionId) {
        Subscription sub = findOwned(userId, subscriptionId);
        subscriptionRepository.delete(sub);
    }

    private Subscription findOwned(Long userId, Long subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
        if (!sub.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found");
        }
        return sub;
    }

    // Called on a timer (see SubscriptionScheduler). A subscription that's
    // out of stock is simply left due - it's picked up again on the next
    // tick once restocked, rather than silently skipping a cycle.
    @Transactional
    public void processDue() {
        Instant now = Instant.now();
        List<Subscription> due = subscriptionRepository.findByActiveTrueAndNextDeliveryDateBefore(now);

        for (Subscription sub : due) {
            Product product = sub.getProduct();
            if (product.getStock() < sub.getQuantity()) {
                continue;
            }

            OrderRequest orderRequest = new OrderRequest(
                    sub.getStore().getId(),
                    List.of(new OrderItemRequest(product.getId(), sub.getQuantity())),
                    null,
                    null
            );
            orderService.createOrder(sub.getUser().getId(), orderRequest);

            sub.setNextDeliveryDate(now.plus(sub.getIntervalMinutes(), ChronoUnit.MINUTES));
            subscriptionRepository.save(sub);
        }
    }
}
