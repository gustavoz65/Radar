package com.omnia.platform.catalog.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * A sellable service with the duration and price that drive scheduling. Deactivation hides it from
 * new bookings without touching history.
 */
@Entity
@Table(name = "service_offerings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServiceOffering {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private ServiceOffering(UUID tenantId) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.active = true;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static ServiceOffering create(
            UUID tenantId, String name, String description, int durationMinutes, BigDecimal price) {
        if (tenantId == null) {
            throw new DomainException("service.tenant-required", "A service must belong to a tenant");
        }
        ServiceOffering service = new ServiceOffering(tenantId);
        service.fill(name, description, durationMinutes, price);
        return service;
    }

    public void update(String name, String description, int durationMinutes, BigDecimal price) {
        fill(name, description, durationMinutes, price);
        this.updatedAt = Instant.now();
    }

    public void activate() {
        this.active = true;
        this.updatedAt = Instant.now();
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = Instant.now();
    }

    private void fill(String name, String description, int durationMinutes, BigDecimal price) {
        if (name == null || name.isBlank()) {
            throw new DomainException("service.invalid-name", "Name is required");
        }
        if (durationMinutes < 5 || durationMinutes > 24 * 60) {
            throw new DomainException("service.invalid-duration", "Duration must be between 5 minutes and 24 hours");
        }
        if (price == null || price.signum() < 0) {
            throw new DomainException("service.invalid-price", "Price must be zero or positive");
        }
        this.name = name.trim();
        this.description = description == null || description.isBlank() ? null : description.trim();
        this.durationMinutes = durationMinutes;
        this.price = price;
    }
}
