package com.quickcart.controller;

import com.quickcart.dto.AdminCustomerResponse;
import com.quickcart.dto.AdminOrderResponse;
import com.quickcart.dto.AdminStatsResponse;
import com.quickcart.dto.StoreResponse;
import com.quickcart.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stores")
    public List<StoreResponse> getStores() {
        return adminService.getAllStores().stream().map(s -> StoreResponse.from(s, null, null)).toList();
    }

    @GetMapping("/orders")
    public List<AdminOrderResponse> getOrders() {
        return adminService.getAllOrders().stream().map(AdminOrderResponse::from).toList();
    }

    @GetMapping("/customers")
    public List<AdminCustomerResponse> getCustomers() {
        return adminService.getAllCustomers();
    }

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return adminService.getStats();
    }
}
