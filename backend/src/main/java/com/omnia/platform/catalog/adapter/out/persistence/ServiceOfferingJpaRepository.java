package com.omnia.platform.catalog.adapter.out.persistence;

import com.omnia.platform.catalog.application.port.out.ServiceOfferingRepository;
import com.omnia.platform.catalog.domain.model.ServiceOffering;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingJpaRepository extends ServiceOfferingRepository, JpaRepository<ServiceOffering, UUID> {

    List<ServiceOffering> findByTenantIdOrderByNameAsc(UUID tenantId);

    List<ServiceOffering> findByTenantIdAndActiveTrueOrderByNameAsc(UUID tenantId);

    @Override
    default List<ServiceOffering> findAllOrdered(boolean includeInactive) {
        UUID tenantId = TenantContext.require();
        return includeInactive
                ? findByTenantIdOrderByNameAsc(tenantId)
                : findByTenantIdAndActiveTrueOrderByNameAsc(tenantId);
    }
}
