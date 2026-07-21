package com.omnia.platform.crm.domain.model;

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

/** A lead in the funnel. Moving to WON/LOST is terminal; a lost reason is captured for reporting. */
@Entity
@Table(name = "leads")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Lead {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    private String contact;

    private String source;

    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeadStage stage;

    @Column(name = "lost_reason")
    private String lostReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private Lead(UUID tenantId, String name, String contact, String source, String notes) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.name = name;
        this.contact = contact;
        this.source = source;
        this.notes = notes;
        this.stage = LeadStage.NEW;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static Lead capture(UUID tenantId, String name, String contact, String source, String notes) {
        if (tenantId == null) {
            throw new DomainException("lead.tenant-required", "A lead must belong to a tenant");
        }
        if (name == null || name.isBlank()) {
            throw new DomainException("lead.invalid-name", "Name is required");
        }
        return new Lead(tenantId, name.trim(), blankToNull(contact), blankToNull(source), blankToNull(notes));
    }

    public void moveTo(LeadStage stage) {
        if (this.stage == LeadStage.WON || this.stage == LeadStage.LOST) {
            throw new DomainException("lead.closed", "A won or lost lead cannot change stage");
        }
        if (stage == LeadStage.LOST) {
            throw new DomainException("lead.needs-reason", "Use markLost to close a lead as lost");
        }
        this.stage = stage;
        this.updatedAt = Instant.now();
    }

    public void markLost(String reason) {
        if (this.stage == LeadStage.WON) {
            throw new DomainException("lead.won", "A won lead cannot be marked lost");
        }
        this.stage = LeadStage.LOST;
        this.lostReason = blankToNull(reason);
        this.updatedAt = Instant.now();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
