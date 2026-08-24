package com.quickcart.controller;

import com.quickcart.dto.AuthResponse;
import com.quickcart.dto.LoginRequest;
import com.quickcart.dto.SignupRequest;
import com.quickcart.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/admin-signup")
    public AuthResponse adminSignup(@Valid @RequestBody SignupRequest request) {
        return authService.adminSignup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
