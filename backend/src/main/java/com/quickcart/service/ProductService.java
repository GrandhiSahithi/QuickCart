package com.quickcart.service;

import com.quickcart.model.Product;
import com.quickcart.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductService {

    private static final int MAX_ALTERNATIVES = 4;

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsByStore(Long storeId) {
        return productRepository.findByStoreId(storeId);
    }

    // In-stock alternatives from the same store and menu/category section -
    // e.g. suggesting 2% milk when whole milk is out of stock.
    public List<Product> getAlternatives(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        return productRepository.findByStoreId(product.getStore().getId()).stream()
                .filter(p -> !p.getId().equals(productId))
                .filter(p -> p.getCategory().equals(product.getCategory()))
                .filter(p -> p.getStock() > 0)
                .limit(MAX_ALTERNATIVES)
                .toList();
    }
}
