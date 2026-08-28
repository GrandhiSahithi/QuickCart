package com.quickcart.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sends password-reset OTP codes via the SendGrid v3 REST API (plain HTTP
 * call, no SDK dependency needed). When no API key is configured, the code
 * is logged instead so the flow is fully testable before SendGrid is wired
 * up.
 */
@Slf4j
@Service
public class EmailService {

    private final RestClient restClient = RestClient.create();

    @Value("${sendgrid.api.key:}")
    private String apiKey;

    @Value("${sendgrid.from.email:no-reply@quickcart.app}")
    private String fromEmail;

    public void sendPasswordResetOtp(String toEmail, String code) {
        send(toEmail, "password reset OTP", "Your QuickCart password reset code",
                "Your QuickCart password reset code is " + code + ". It expires in 5 minutes. "
                        + "If you didn't request this, you can ignore this email.");
    }

    private void send(String toEmail, String logLabel, String subject, String body) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("SENDGRID_API_KEY not set - {} for {} is: {}", logLabel, toEmail, body);
            return;
        }

        Map<String, Object> payload = Map.of(
                "personalizations", List.of(Map.of("to", List.of(Map.of("email", toEmail)))),
                "from", Map.of("email", fromEmail, "name", "QuickCart"),
                "subject", subject,
                "content", List.of(Map.of(
                        "type", "text/plain",
                        "value", body
                ))
        );

        try {
            restClient.post()
                    .uri("https://api.sendgrid.com/v3/mail/send")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to send {} email via SendGrid for {}: {}", logLabel, toEmail, e.getMessage());
        }
    }
}
