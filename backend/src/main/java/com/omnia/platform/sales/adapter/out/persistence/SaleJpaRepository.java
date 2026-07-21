package com.omnia.platform.sales.adapter.out.persistence;

import com.omnia.platform.sales.application.port.out.SaleRepository;
import com.omnia.platform.sales.domain.model.Sale;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleJpaRepository extends SaleRepository, JpaRepository<Sale, UUID> {

    List<Sale> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Limit limit);

    @Override
    default List<Sale> findRecent(int limit) {
        return findByTenantIdOrderByCreatedAtDesc(TenantContext.require(), Limit.of(limit));
    }
}
