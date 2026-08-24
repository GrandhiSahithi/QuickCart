package com.quickcart.repository;

import com.quickcart.model.Order;
import com.quickcart.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByStatusNotIn(List<OrderStatus> statuses);
    List<Order> findAllByOrderByCreatedAtDesc();
}
