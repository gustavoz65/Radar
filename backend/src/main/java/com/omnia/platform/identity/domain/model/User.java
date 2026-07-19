package com.omnia.platform.identity.domain.model;

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
 * User aggregate. Belongs to exactly one tenant (ADR-008); e-mail is unique per tenant. The
 * password is stored as an Argon2id hash — the raw password never reaches this class.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Column(name = "is_owner", nullable = false)
    private boolean owner;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private User(UUID tenantId, String name, String email, String passwordHash, boolean owner) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.status = UserStatus.ACTIVE;
        this.owner = owner;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static User owner(UUID tenantId, String name, String email, String passwordHash) {
        return create(tenantId, name, email, passwordHash, true);
    }

    public static User member(UUID tenantId, String name, String email, String passwordHash) {
        return create(tenantId, name, email, passwordHash, false);
    }

    private static User create(UUID tenantId, String name, String email, String passwordHash, boolean owner) {
        if (tenantId == null) {
            throw new DomainException("user.tenant-required", "A user must belong to a tenant");
        }
        if (name == null || name.isBlank()) {
            throw new DomainException("user.invalid-name", "Name is required");
        }
        if (email == null || !email.contains("@")) {
            throw new DomainException("user.invalid-email", "A valid e-mail is required");
        }
        return new User(tenantId, name.trim(), email.trim().toLowerCase(), passwordHash, owner);
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public void deactivate() {
        this.status = UserStatus.INACTIVE;
        this.updatedAt = Instant.now();
    }
}
