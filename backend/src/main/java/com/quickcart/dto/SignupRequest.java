package com.quickcart.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SignupRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}$",
                message = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character"
        )
        String password
) {
}
