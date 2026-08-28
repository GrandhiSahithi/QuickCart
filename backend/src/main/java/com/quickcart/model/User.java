package com.quickcart.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean premium = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CUSTOMER;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    // Login OTP challenge state - all nullable, cleared once verified.
    private String otpCodeHash;
    private Instant otpExpiresAt;
    private Instant otpLastSentAt;

    // Forgot-password OTP challenge state - kept separate from the login OTP
    // fields above so a reset code (issued without proving the password)
    // can never be replayed against the login verify-otp endpoint.
    private String resetOtpCodeHash;
    private Instant resetOtpExpiresAt;
    private Instant resetOtpLastSentAt;

    public User(String name, String email, String passwordHash) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
    }
}
