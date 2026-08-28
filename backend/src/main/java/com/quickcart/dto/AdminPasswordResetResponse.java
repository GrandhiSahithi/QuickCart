package com.quickcart.dto;

// The temporary password is returned exactly once, in this response, so the
// admin can hand it to the customer - it is never stored or logged in plain
// text anywhere; only its bcrypt hash is persisted on the User.
public record AdminPasswordResetResponse(
        Long userId,
        String email,
        String temporaryPassword
) {
}
