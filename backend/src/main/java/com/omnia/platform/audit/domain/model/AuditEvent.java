package com.omnia.platform.audit.domain.model;

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

/** Append-only audit record. No mutators: once created it never changes (LGPD trail). */
@Entity
@Table(name = "audit_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditEvent {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(nullable = false, updatable = false)
    private String action;

    @Column(name = "entity_type", nullable = false, updatable = false)
    private String entityType;

    @Column(name = "entity_id", updatable = false)
    private UUID entityId;

    @Column(nullable = false, updatable = false)
    private String summary;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    private AuditEvent(
            UUID tenantId, UUID actorUserId, String action, String entityType, UUID entityId, String summary) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.actorUserId = actorUserId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.summary = summary;
        this.occurredAt = Instant.now();
    }

    public static AuditEvent of(
            UUID tenantId, UUID actorUserId, String action, String entityType, UUID entityId, String summary) {
        return new AuditEvent(tenantId, actorUserId, action, entityType, entityId, summary);
    }
}
