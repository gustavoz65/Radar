package com.omnia.platform.integration.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnia.platform.integration.application.port.out.WebhookSubscriptionRepository;
import com.omnia.platform.integration.domain.model.WebhookSubscription;
import com.omnia.platform.sales.SaleCompleted;
import com.omnia.platform.scheduling.AppointmentBooked;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.client.RestClient;

/**
 * Delivers HMAC-signed webhook payloads to a tenant's subscriptions when domain events fire.
 * Best-effort: delivery failures are logged, never propagated (they must not affect the business
 * transaction that already committed).
 */
@Component
class WebhookDispatcher {

    private static final Logger log = LoggerFactory.getLogger(WebhookDispatcher.class);

    private final WebhookSubscriptionRepository subscriptions;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    WebhookDispatcher(WebhookSubscriptionRepository subscriptions, ObjectMapper objectMapper) {
        this.subscriptions = subscriptions;
        this.objectMapper = objectMapper;
    }

    @TransactionalEventListener
    void onAppointmentBooked(AppointmentBooked event) {
        deliver(
                event.tenantId(),
                "appointment.booked",
                Map.of(
                        "appointmentId", event.appointmentId(),
                        "customerName", event.customerName(),
                        "serviceName", event.serviceName(),
                        "startTime", event.startTime().toString()));
    }

    @TransactionalEventListener
    void onSaleCompleted(SaleCompleted event) {
        deliver(
                event.tenantId(),
                "sale.completed",
                Map.of(
                        "saleId", event.saleId(),
                        "total", event.total(),
                        "completedAt", event.completedAt().toString()));
    }

    private void deliver(UUID tenantId, String eventType, Map<String, Object> data) {
        TenantContext.runAs(tenantId, () -> {
            for (WebhookSubscription subscription : subscriptions.findActiveByTenantAndEvent(tenantId, eventType)) {
                post(subscription, eventType, data);
            }
        });
    }

    private void post(WebhookSubscription subscription, String eventType, Map<String, Object> data) {
        try {
            String body = objectMapper.writeValueAsString(Map.of("event", eventType, "data", data));
            String signature = sign(body, subscription.getSecret());
            restClient
                    .post()
                    .uri(subscription.getUrl())
                    .header("Content-Type", "application/json")
                    .header("X-Omnia-Signature", signature)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RuntimeException | com.fasterxml.jackson.core.JsonProcessingException exception) {
            log.warn("Webhook delivery to {} failed: {}", subscription.getUrl(), exception.getMessage());
        }
    }

    private String sign(String body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder("sha256=");
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("Cannot sign webhook payload", exception);
        }
    }
}
