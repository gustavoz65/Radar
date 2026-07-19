package com.omnia.platform.tenant.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import com.omnia.platform.tenant.Vertical;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root of the tenant registry. Global table (no tenant_id): it is the source of all
 * tenant identifiers. State transitions are aggregate methods; invalid transitions throw.
 */
@Entity
@Table(name = "tenants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tenant {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Vertical vertical;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantStatus status;

    @Column(nullable = false)
    private String timezone;

    @Column(nullable = false)
    private String locale;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private Tenant(UUID id, String slug, String name, Vertical vertical) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.vertical = vertical;
        this.status = TenantStatus.TRIAL;
        this.timezone = "America/Sao_Paulo";
        this.locale = "pt-BR";
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    /** Factory enforcing creation invariants (ADR-004: no builders on aggregates). */
    public static Tenant signUp(String slug, String name, Vertical vertical) {
        if (slug == null || !slug.matches("[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?")) {
            throw new DomainException(
                    "tenant.invalid-slug", "Slug must be 3-40 chars of lowercase letters, digits and hyphens");
        }
        if (name == null || name.isBlank()) {
            throw new DomainException("tenant.invalid-name", "Name is required");
        }
        return new Tenant(Ids.newId(), slug, name.trim(), vertical);
    }

    public void activate() {
        if (status == TenantStatus.CANCELLED) {
            throw new DomainException("tenant.cancelled", "A cancelled tenant cannot be activated");
        }
        transition(TenantStatus.ACTIVE);
    }

    public void suspend() {
        if (status != TenantStatus.ACTIVE && status != TenantStatus.TRIAL) {
            throw new DomainException("tenant.invalid-transition", "Only active or trial tenants can be suspended");
        }
        transition(TenantStatus.SUSPENDED);
    }

    public void cancel() {
        transition(TenantStatus.CANCELLED);
    }

    private void transition(TenantStatus next) {
        this.status = next;
        this.updatedAt = Instant.now();
    }
}
