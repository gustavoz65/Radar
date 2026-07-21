package com.omnia.platform.inventory.domain.model;

import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Append-only record of a stock change. Never updated or deleted (the balance is derived from these). */
@Entity
@Table(name = "stock_movements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockMovement {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "stock_item_id", nullable = false, updatable = false)
    private UUID stockItemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private MovementType type;

    @Column(nullable = false, updatable = false)
    private int amount;

    @Column(nullable = false, updatable = false)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public StockMovement(UUID tenantId, UUID stockItemId, MovementType type, int amount, String reason) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.stockItemId = stockItemId;
        this.type = type;
        this.amount = amount;
        this.reason = reason == null || reason.isBlank() ? "-" : reason.trim();
        this.createdAt = Instant.now();
    }
}
