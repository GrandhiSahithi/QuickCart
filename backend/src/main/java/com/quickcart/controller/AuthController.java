package com.quickcart.controller;

import com.quickcart.dto.AuthResponse;
import com.quickcart.dto.ForgotPasswordRequest;
import com.quickcart.dto.LoginRequest;
import com.quickcart.dto.OtpChallengeResponse;
import com.quickcart.dto.ResendOtpRequest;
import com.quickcart.dto.ResetPasswordRequest;
import com.quickcart.dto.SignupRequest;
import com.quickcart.dto.VerifyOtpRequest;
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
    public OtpChallengeResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return authService.verifyOtp(request);
    }

    @PostMapping("/resend-otp")
    public OtpChallengeResponse resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        return authService.resendOtp(request);
    }

    @PostMapping("/forgot-password")
    public OtpChallengeResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public AuthResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}
