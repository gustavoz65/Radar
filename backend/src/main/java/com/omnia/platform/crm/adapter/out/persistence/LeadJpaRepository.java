package com.omnia.platform.crm.adapter.out.persistence;

import com.omnia.platform.crm.application.port.out.LeadRepository;
import com.omnia.platform.crm.domain.model.Lead;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadJpaRepository extends LeadRepository, JpaRepository<Lead, UUID> {

    List<Lead> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    @Override
    default List<Lead> findAllOrdered() {
        return findByTenantIdOrderByCreatedAtDesc(TenantContext.require());
    }
}
