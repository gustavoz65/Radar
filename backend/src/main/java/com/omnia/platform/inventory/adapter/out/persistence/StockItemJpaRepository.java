package com.omnia.platform.inventory.adapter.out.persistence;

import com.omnia.platform.inventory.domain.model.StockItem;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockItemJpaRepository extends JpaRepository<StockItem, UUID> {

    List<StockItem> findByTenantIdOrderByProductNameAsc(UUID tenantId);

    Optional<StockItem> findByTenantIdAndProductId(UUID tenantId, UUID productId);

    default List<StockItem> findAllForTenant() {
        return findByTenantIdOrderByProductNameAsc(TenantContext.require());
    }

    default Optional<StockItem> findByProduct(UUID productId) {
        return findByTenantIdAndProductId(TenantContext.require(), productId);
    }
}
