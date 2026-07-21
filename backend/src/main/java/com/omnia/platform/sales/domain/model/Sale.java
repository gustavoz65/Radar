package com.omnia.platform.sales.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Sale aggregate (comanda): items + payments. Totals are always derived from items minus discount;
 * the sale is PAID only once payments cover the total. Item/payment mutation is blocked after PAID.
 */
@Entity
@Table(name = "sales")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Sale {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_name")
    private String customerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SaleStatus status;

    @Column(nullable = false)
    private BigDecimal discount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Version
    private long version;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "sale_id", nullable = false)
    private List<SaleItem> items = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "sale_id", nullable = false)
    private List<SalePayment> payments = new ArrayList<>();

    private Sale(UUID tenantId, UUID customerId, String customerName) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.status = SaleStatus.OPEN;
        this.discount = BigDecimal.ZERO;
        this.createdAt = Instant.now();
    }

    public static Sale open(UUID tenantId, UUID customerId, String customerName) {
        if (tenantId == null) {
            throw new DomainException("sale.tenant-required", "A sale must belong to a tenant");
        }
        return new Sale(tenantId, customerId, customerName);
    }

    public void addItem(String kind, UUID referenceId, String description, int quantity, BigDecimal unitPrice) {
        requireOpen();
        if (quantity < 1) {
            throw new DomainException("sale.invalid-quantity", "Quantity must be at least 1");
        }
        if (unitPrice == null || unitPrice.signum() < 0) {
            throw new DomainException("sale.invalid-price", "Unit price must be zero or positive");
        }
        items.add(new SaleItem(id, kind, referenceId, description, quantity, unitPrice));
    }

    public void applyDiscount(BigDecimal discount) {
        requireOpen();
        if (discount == null || discount.signum() < 0 || discount.compareTo(itemsTotal()) > 0) {
            throw new DomainException("sale.invalid-discount", "Discount must be between 0 and the items total");
        }
        this.discount = discount;
    }

    public void addPayment(String method, BigDecimal amount) {
        requireOpen();
        if (amount == null || amount.signum() <= 0) {
            throw new DomainException("sale.invalid-payment", "Payment amount must be positive");
        }
        payments.add(new SalePayment(id, method, amount));
    }

    /** Marks the sale PAID; requires items and payments covering the total. */
    public void complete() {
        requireOpen();
        if (items.isEmpty()) {
            throw new DomainException("sale.empty", "Cannot complete a sale with no items");
        }
        if (paymentsTotal().compareTo(total()) < 0) {
            throw new DomainException("sale.underpaid", "Payments do not cover the sale total");
        }
        this.status = SaleStatus.PAID;
        this.completedAt = Instant.now();
    }

    public void cancel() {
        if (status == SaleStatus.PAID) {
            throw new DomainException("sale.already-paid", "A paid sale cannot be cancelled (refund instead)");
        }
        this.status = SaleStatus.CANCELLED;
    }

    public BigDecimal itemsTotal() {
        return items.stream().map(SaleItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal total() {
        return itemsTotal().subtract(discount).max(BigDecimal.ZERO);
    }

    public BigDecimal paymentsTotal() {
        return payments.stream().map(SalePayment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<SaleItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public List<SalePayment> getPayments() {
        return Collections.unmodifiableList(payments);
    }

    private void requireOpen() {
        if (status != SaleStatus.OPEN) {
            throw new DomainException("sale.not-open", "The sale is not open (status: " + status + ")");
        }
    }
}
