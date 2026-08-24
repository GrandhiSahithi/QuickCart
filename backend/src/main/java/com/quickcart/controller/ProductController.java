package com.quickcart.controller;

import com.quickcart.dto.ProductResponse;
import com.quickcart.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> getProducts() {
        return productService.getAllProducts().stream().map(ProductResponse::from).toList();
    }
}
