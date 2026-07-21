package com.omnia.platform.notification.domain.model;

import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** In-app notification for a specific member of a tenant. */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "recipient_user_id", nullable = false)
    private UUID recipientUserId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String body;

    @Column(name = "read", nullable = false)
    private boolean read;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    private Notification(UUID tenantId, UUID recipientUserId, String title, String body) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.recipientUserId = recipientUserId;
        this.title = title;
        this.body = body;
        this.read = false;
        this.createdAt = Instant.now();
    }

    public static Notification to(UUID tenantId, UUID recipientUserId, String title, String body) {
        return new Notification(tenantId, recipientUserId, title, body);
    }

    public void markRead() {
        this.read = true;
    }
}
