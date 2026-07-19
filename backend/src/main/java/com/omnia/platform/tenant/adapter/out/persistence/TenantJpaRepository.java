package com.omnia.platform.tenant.adapter.out.persistence;

import com.omnia.platform.tenant.application.port.out.TenantRepository;
import com.omnia.platform.tenant.domain.model.Tenant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** JPA adapter implementing the persistence port by Spring Data derivation. */
public interface TenantJpaRepository extends TenantRepository, JpaRepository<Tenant, UUID> {}
