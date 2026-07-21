package com.omnia.platform.workorder.domain.model;

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
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Work order aggregate. Status flows OPEN → APPROVED → IN_PROGRESS → DONE → DELIVERED, with CANCELLED
 * reachable before delivery. Items may only change before the order is DONE.
 */
@Entity
@Table(name = "work_orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkOrder {

    private static final Map<WorkOrderStatus, Set<WorkOrderStatus>> TRANSITIONS = Map.of(
            WorkOrderStatus.OPEN, Set.of(WorkOrderStatus.APPROVED, WorkOrderStatus.CANCELLED),
            WorkOrderStatus.APPROVED, Set.of(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED),
            WorkOrderStatus.IN_PROGRESS, Set.of(WorkOrderStatus.DONE, WorkOrderStatus.CANCELLED),
            WorkOrderStatus.DONE, Set.of(WorkOrderStatus.DELIVERED));

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "work_order_id", nullable = false)
    private List<WorkOrderItem> items = new ArrayList<>();

    private WorkOrder(UUID tenantId, UUID customerId, String customerName, String title, String description) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.title = title;
        this.description = description;
        this.status = WorkOrderStatus.OPEN;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public static WorkOrder open(
            UUID tenantId, UUID customerId, String customerName, String title, String description) {
        if (tenantId == null || customerId == null) {
            throw new DomainException("workorder.invalid", "Tenant and customer are required");
        }
        if (title == null || title.isBlank()) {
            throw new DomainException("workorder.invalid-title", "Title is required");
        }
        return new WorkOrder(
                tenantId,
                customerId,
                customerName,
                title.trim(),
                description == null || description.isBlank() ? null : description.trim());
    }

    public void addItem(String description, int quantity, BigDecimal unitPrice) {
        if (status == WorkOrderStatus.DONE
                || status == WorkOrderStatus.DELIVERED
                || status == WorkOrderStatus.CANCELLED) {
            throw new DomainException("workorder.locked", "Items cannot change after the order is done");
        }
        if (quantity < 1 || unitPrice == null || unitPrice.signum() < 0) {
            throw new DomainException("workorder.invalid-item", "Invalid item quantity or price");
        }
        items.add(new WorkOrderItem(id, description.trim(), quantity, unitPrice));
        this.updatedAt = Instant.now();
    }

    public void transitionTo(WorkOrderStatus next) {
        if (!TRANSITIONS.getOrDefault(status, Set.of()).contains(next)) {
            throw new DomainException(
                    "workorder.invalid-transition", "Cannot go from %s to %s".formatted(status, next));
        }
        this.status = next;
        this.updatedAt = Instant.now();
    }

    public BigDecimal total() {
        return items.stream().map(WorkOrderItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<WorkOrderItem> getItems() {
        return Collections.unmodifiableList(items);
    }
}
