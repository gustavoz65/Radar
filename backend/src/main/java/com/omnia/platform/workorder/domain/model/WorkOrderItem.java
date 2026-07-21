package com.omnia.platform.workorder.domain.model;

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

/** A part or labor line on a work order. */
@Entity
@Table(name = "work_order_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkOrderItem {

    @Id
    private UUID id;

    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    WorkOrderItem(UUID workOrderId, String description, int quantity, BigDecimal unitPrice) {
        this.id = Ids.newId();
        this.workOrderId = workOrderId;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
