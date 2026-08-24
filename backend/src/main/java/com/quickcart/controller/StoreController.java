package com.quickcart.controller;

import com.quickcart.dto.ProductResponse;
import com.quickcart.dto.StoreResponse;
import com.quickcart.model.Vertical;
import com.quickcart.service.ProductService;
import com.quickcart.service.StoreService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    private final StoreService storeService;
    private final ProductService productService;

    public StoreController(StoreService storeService, ProductService productService) {
        this.storeService = storeService;
        this.productService = productService;
    }

    @GetMapping
    public List<StoreResponse> getStores(@RequestParam(required = false) Vertical vertical,
                                          @RequestParam(required = false) Double lat,
                                          @RequestParam(required = false) Double lng) {
        return storeService.getStores(vertical).stream().map(s -> StoreResponse.from(s, lat, lng)).toList();
    }

    @GetMapping("/{id}")
    public StoreResponse getStore(@PathVariable Long id,
                                   @RequestParam(required = false) Double lat,
                                   @RequestParam(required = false) Double lng) {
        return StoreResponse.from(storeService.getStore(id), lat, lng);
    }

    @GetMapping("/{id}/products")
    public List<ProductResponse> getStoreProducts(@PathVariable Long id) {
        return productService.getProductsByStore(id).stream().map(ProductResponse::from).toList();
    }
}
