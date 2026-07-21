package com.omnia.platform.integration.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A tenant's subscription of a URL to a domain event, with a secret used to sign deliveries. */
@Entity
@Table(name = "webhook_subscriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WebhookSubscription {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String secret;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Version
    private long version;

    private WebhookSubscription(UUID tenantId, String eventType, String url) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.eventType = eventType;
        this.url = url;
        this.secret = generateSecret();
        this.active = true;
        this.createdAt = Instant.now();
    }

    public static WebhookSubscription create(UUID tenantId, String eventType, String url) {
        if (tenantId == null) {
            throw new DomainException("webhook.tenant-required", "A subscription must belong to a tenant");
        }
        if (!"appointment.booked".equals(eventType) && !"sale.completed".equals(eventType)) {
            throw new DomainException("webhook.invalid-event", "Unsupported event type");
        }
        if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
            throw new DomainException("webhook.invalid-url", "URL must be http(s)");
        }
        return new WebhookSubscription(tenantId, eventType, url.trim());
    }

    public void deactivate() {
        this.active = false;
    }

    private static String generateSecret() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return "whsec_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
