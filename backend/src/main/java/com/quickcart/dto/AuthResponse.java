package com.quickcart.dto;

public record AuthResponse(
        String token,
        Long id,
        String name,
        String email,
        boolean premium,
        String role
) {
}
