package com.quickcart.service;

import com.quickcart.model.Store;
import com.quickcart.model.Vertical;
import com.quickcart.repository.StoreRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class StoreService {

    private final StoreRepository storeRepository;

    public StoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    public List<Store> getStores(Vertical vertical) {
        return vertical == null ? storeRepository.findAll() : storeRepository.findByVertical(vertical);
    }

    public Store getStore(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Store not found"));
    }
}
