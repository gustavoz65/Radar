package com.omnia.platform.customer.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
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
 * Customer aggregate — a person (or company) served by the tenant. Archiving is the only removal:
 * the visit/sale history a customer accumulates is the tenant's main asset, so hard deletes are
 * reserved for LGPD erasure flows.
 */
@Entity
@Table(name = "customers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Customer {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    private String email;

    private String phone;

    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private Customer(UUID tenantId, String name, String email, String phone, String notes) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.status = CustomerStatus.ACTIVE;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
        fill(name, email, phone, notes);
    }

    public static Customer register(UUID tenantId, String name, String email, String phone, String notes) {
        if (tenantId == null) {
            throw new DomainException("customer.tenant-required", "A customer must belong to a tenant");
        }
        return new Customer(tenantId, name, email, phone, notes);
    }

    public void update(String name, String email, String phone, String notes) {
        fill(name, email, phone, notes);
        this.updatedAt = Instant.now();
    }

    public void archive() {
        this.status = CustomerStatus.ARCHIVED;
        this.updatedAt = Instant.now();
    }

    public void restore() {
        this.status = CustomerStatus.ACTIVE;
        this.updatedAt = Instant.now();
    }

    private void fill(String name, String email, String phone, String notes) {
        if (name == null || name.isBlank()) {
            throw new DomainException("customer.invalid-name", "Name is required");
        }
        if (email != null && !email.isBlank() && !email.contains("@")) {
            throw new DomainException("customer.invalid-email", "E-mail is invalid");
        }
        this.name = name.trim();
        this.email = email == null || email.isBlank() ? null : email.trim().toLowerCase();
        this.phone = phone == null || phone.isBlank() ? null : phone.trim();
        this.notes = notes == null || notes.isBlank() ? null : notes.trim();
    }
}
