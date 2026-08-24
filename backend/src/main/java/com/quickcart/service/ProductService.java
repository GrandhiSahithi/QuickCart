package com.quickcart.service;

import com.quickcart.model.Product;
import com.quickcart.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

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
}
