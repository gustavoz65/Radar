package com.omnia.platform.tenant.application.port.out;

import com.omnia.platform.tenant.domain.model.Tenant;
import java.util.Optional;
import java.util.UUID;

/** Persistence port of the tenant module (implemented by the JPA adapter). */
public interface TenantRepository {

    Tenant save(Tenant tenant);

    Optional<Tenant> findById(UUID id);

    Optional<Tenant> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
