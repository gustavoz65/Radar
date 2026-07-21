package com.omnia.platform.catalog.adapter.out.persistence;

import com.omnia.platform.catalog.application.port.out.ProductRepository;
import com.omnia.platform.catalog.domain.model.Product;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductJpaRepository extends ProductRepository, JpaRepository<Product, UUID> {

    List<Product> findByTenantIdOrderByNameAsc(UUID tenantId);

    List<Product> findByTenantIdAndActiveTrueOrderByNameAsc(UUID tenantId);

    @Override
    default List<Product> findAllOrdered(boolean includeInactive) {
        UUID tenantId = TenantContext.require();
        return includeInactive
                ? findByTenantIdOrderByNameAsc(tenantId)
                : findByTenantIdAndActiveTrueOrderByNameAsc(tenantId);
    }
}
