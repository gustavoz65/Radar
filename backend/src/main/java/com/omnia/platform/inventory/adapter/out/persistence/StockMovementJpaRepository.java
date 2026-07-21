package com.omnia.platform.inventory.adapter.out.persistence;

import com.omnia.platform.inventory.domain.model.StockMovement;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementJpaRepository extends JpaRepository<StockMovement, UUID> {

    List<StockMovement> findByTenantIdAndStockItemIdOrderByCreatedAtDesc(UUID tenantId, UUID stockItemId, Limit limit);

    default List<StockMovement> findRecent(UUID stockItemId, int limit) {
        return findByTenantIdAndStockItemIdOrderByCreatedAtDesc(TenantContext.require(), stockItemId, Limit.of(limit));
    }
}
