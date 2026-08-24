package com.quickcart.dto;

import com.quickcart.model.User;

public record UserResponse(
        Long id,
        String name,
        String email,
        boolean premium,
        String role
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.isPremium(), user.getRole().name());
    }
}
