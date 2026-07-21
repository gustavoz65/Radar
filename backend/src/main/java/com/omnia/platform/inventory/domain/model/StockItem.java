package com.omnia.platform.inventory.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Current stock balance for a product. The balance is a derived cache kept in sync by applying
 * movements; it must never go negative on an OUT movement.
 */
@Entity
@Table(name = "stock_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockItem {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "min_quantity", nullable = false)
    private int minQuantity;

    @Version
    private long version;

    private StockItem(UUID tenantId, UUID productId, String productName, int minQuantity) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = 0;
        this.minQuantity = minQuantity;
    }

    public static StockItem create(UUID tenantId, UUID productId, String productName, int minQuantity) {
        return new StockItem(tenantId, productId, productName, Math.max(0, minQuantity));
    }

    public void apply(MovementType type, int amount) {
        if (amount <= 0) {
            throw new DomainException("stock.invalid-amount", "Movement amount must be positive");
        }
        int next =
                switch (type) {
                    case IN -> quantity + amount;
                    case OUT -> quantity - amount;
                    case ADJUST -> amount;
                };
        if (next < 0) {
            throw new DomainException("stock.insufficient", "Not enough stock for this movement");
        }
        this.quantity = next;
    }

    public void setMinQuantity(int minQuantity) {
        this.minQuantity = Math.max(0, minQuantity);
    }

    public boolean isBelowMinimum() {
        return quantity < minQuantity;
    }
}
