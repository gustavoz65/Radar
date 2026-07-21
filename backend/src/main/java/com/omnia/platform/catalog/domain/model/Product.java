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
 * A sellable physical item. Stock control arrives with the inventory module (Fase 3) — here we
 * keep only the commercial identity (sku, price, cost).
 */
@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    private String sku;

    @Column(nullable = false)
    private BigDecimal price;

    private BigDecimal cost;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private Product(UUID tenantId) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.active = true;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static Product create(UUID tenantId, String name, String sku, BigDecimal price, BigDecimal cost) {
        if (tenantId == null) {
            throw new DomainException("product.tenant-required", "A product must belong to a tenant");
        }
        Product product = new Product(tenantId);
        product.fill(name, sku, price, cost);
        return product;
    }

    public void update(String name, String sku, BigDecimal price, BigDecimal cost) {
        fill(name, sku, price, cost);
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

    private void fill(String name, String sku, BigDecimal price, BigDecimal cost) {
        if (name == null || name.isBlank()) {
            throw new DomainException("product.invalid-name", "Name is required");
        }
        if (price == null || price.signum() < 0) {
            throw new DomainException("product.invalid-price", "Price must be zero or positive");
        }
        if (cost != null && cost.signum() < 0) {
            throw new DomainException("product.invalid-cost", "Cost must be zero or positive");
        }
        this.name = name.trim();
        this.sku = sku == null || sku.isBlank() ? null : sku.trim();
        this.price = price;
        this.cost = cost;
    }
}
