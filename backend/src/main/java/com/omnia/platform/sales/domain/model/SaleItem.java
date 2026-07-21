package com.omnia.platform.sales.domain.model;

import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A line in a sale: a snapshot of a catalog service/product at the time of sale. */
@Entity
@Table(name = "sale_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SaleItem {

    @Id
    private UUID id;

    @Column(name = "sale_id", nullable = false)
    private UUID saleId;

    @Column(name = "kind", nullable = false)
    private String kind; // SERVICE or PRODUCT

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    SaleItem(UUID saleId, String kind, UUID referenceId, String description, int quantity, BigDecimal unitPrice) {
        this.id = Ids.newId();
        this.saleId = saleId;
        this.kind = kind;
        this.referenceId = referenceId;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
