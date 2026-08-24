package com.quickcart.repository;

import com.quickcart.model.Store;
import com.quickcart.model.Vertical;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByVertical(Vertical vertical);
}
