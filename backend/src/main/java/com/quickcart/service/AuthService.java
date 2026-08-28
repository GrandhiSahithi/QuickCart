package com.quickcart.service;

import com.quickcart.dto.AuthResponse;
import com.quickcart.dto.ForgotPasswordRequest;
import com.quickcart.dto.LoginRequest;
import com.quickcart.dto.OtpChallengeResponse;
import com.quickcart.dto.ResendOtpRequest;
import com.quickcart.dto.ResetPasswordRequest;
import com.quickcart.dto.SignupRequest;
import com.quickcart.dto.VerifyOtpRequest;
import com.quickcart.model.Role;
import com.quickcart.model.User;
import com.quickcart.repository.UserRepository;
import com.quickcart.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private static final int OTP_TTL_SECONDS = 300;
    private static final int OTP_RESEND_COOLDOWN_SECONDS = 30;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                        EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    public AuthResponse signup(SignupRequest request) {
        return signup(request, Role.CUSTOMER);
    }

    public AuthResponse adminSignup(SignupRequest request) {
        return signup(request, Role.ADMIN);
    }

    private AuthResponse signup(SignupRequest request, Role role) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User(request.name(), request.email(), passwordEncoder.encode(request.password()));
        user.setRole(role);
        userRepository.save(user);

        return toAuthResponse(user);
    }

    public OtpChallengeResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return issueOtp(user);
    }

    public OtpChallengeResponse resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No pending login for this email"));

        if (user.getOtpLastSentAt() != null
                && user.getOtpLastSentAt().plusSeconds(OTP_RESEND_COOLDOWN_SECONDS).isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code");
        }

        return issueOtp(user);
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired code"));

        if (user.getOtpCodeHash() == null || user.getOtpExpiresAt() == null
                || user.getOtpExpiresAt().isBefore(Instant.now())
                || !passwordEncoder.matches(request.code(), user.getOtpCodeHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired code");
        }

        user.setOtpCodeHash(null);
        user.setOtpExpiresAt(null);
        user.setOtpLastSentAt(null);
        userRepository.save(user);

        return toAuthResponse(user);
    }

    public OtpChallengeResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found for this email"));

        if (user.getResetOtpLastSentAt() != null
                && user.getResetOtpLastSentAt().plusSeconds(OTP_RESEND_COOLDOWN_SECONDS).isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        user.setResetOtpCodeHash(passwordEncoder.encode(code));
        user.setResetOtpExpiresAt(Instant.now().plus(OTP_TTL_SECONDS, ChronoUnit.SECONDS));
        user.setResetOtpLastSentAt(Instant.now());
        userRepository.save(user);

        emailService.sendPasswordResetOtp(user.getEmail(), code);

        return new OtpChallengeResponse(user.getEmail(), OTP_TTL_SECONDS);
    }

    public AuthResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired code"));

        if (user.getResetOtpCodeHash() == null || user.getResetOtpExpiresAt() == null
                || user.getResetOtpExpiresAt().isBefore(Instant.now())
                || !passwordEncoder.matches(request.code(), user.getResetOtpCodeHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired code");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setResetOtpCodeHash(null);
        user.setResetOtpExpiresAt(null);
        user.setResetOtpLastSentAt(null);
        userRepository.save(user);

        return toAuthResponse(user);
    }

    private OtpChallengeResponse issueOtp(User user) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        user.setOtpCodeHash(passwordEncoder.encode(code));
        user.setOtpExpiresAt(Instant.now().plus(OTP_TTL_SECONDS, ChronoUnit.SECONDS));
        user.setOtpLastSentAt(Instant.now());
        userRepository.save(user);

        emailService.sendOtp(user.getEmail(), code);

        return new OtpChallengeResponse(user.getEmail(), OTP_TTL_SECONDS);
    }

    private AuthResponse toAuthResponse(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.isPremium(), user.getRole().name());
    }
}
