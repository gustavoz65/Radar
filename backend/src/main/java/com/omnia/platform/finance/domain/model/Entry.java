package com.omnia.platform.finance.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * A financial ledger entry (a receivable or payable). Sale-originated income comes in already
 * settled; manual entries can be scheduled and settled later.
 */
@Entity
@Table(name = "finance_entries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Entry {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntryType type;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntryStatus status;

    @Column(name = "source_type")
    private String sourceType;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Version
    private long version;

    private Entry(
            UUID tenantId,
            EntryType type,
            String category,
            String description,
            BigDecimal amount,
            LocalDate dueDate,
            EntryStatus status,
            String sourceType,
            UUID sourceId) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.type = type;
        this.category = category;
        this.description = description;
        this.amount = amount;
        this.dueDate = dueDate;
        this.status = status;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.createdAt = Instant.now();
    }

    public static Entry manual(
            UUID tenantId, EntryType type, String category, String description, BigDecimal amount, LocalDate dueDate) {
        validate(type, category, description, amount);
        return new Entry(
                tenantId,
                type,
                category.trim(),
                description.trim(),
                amount,
                dueDate == null ? LocalDate.now() : dueDate,
                EntryStatus.PENDING,
                null,
                null);
    }

    /** Settled income coming from a completed sale. */
    public static Entry fromSale(UUID tenantId, UUID saleId, String description, BigDecimal amount) {
        return new Entry(
                tenantId,
                EntryType.INCOME,
                "Vendas",
                description,
                amount,
                LocalDate.now(),
                EntryStatus.SETTLED,
                "sale",
                saleId);
    }

    public void settle() {
        this.status = EntryStatus.SETTLED;
    }

    private static void validate(EntryType type, String category, String description, BigDecimal amount) {
        if (type == null) {
            throw new DomainException("entry.invalid-type", "Type is required");
        }
        if (category == null || category.isBlank()) {
            throw new DomainException("entry.invalid-category", "Category is required");
        }
        if (description == null || description.isBlank()) {
            throw new DomainException("entry.invalid-description", "Description is required");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new DomainException("entry.invalid-amount", "Amount must be positive");
        }
    }
}
