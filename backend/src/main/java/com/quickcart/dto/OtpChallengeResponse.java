package com.quickcart.dto;

public record OtpChallengeResponse(
        String email,
        int expiresInSeconds
) {
}
