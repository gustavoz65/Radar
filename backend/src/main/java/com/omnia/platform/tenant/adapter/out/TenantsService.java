package com.omnia.platform.tenant.adapter.out;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.tenant.Tenants;
import com.omnia.platform.tenant.Vertical;
import com.omnia.platform.tenant.application.port.out.TenantRepository;
import com.omnia.platform.tenant.domain.model.Tenant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implements the module's public API ({@link Tenants}) on top of the persistence port. */
@Service
@Transactional(readOnly = true)
class TenantsService implements Tenants {

    private final TenantRepository repository;

    TenantsService(TenantRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public TenantSummary signUp(String slug, String companyName, Vertical vertical) {
        if (repository.existsBySlug(slug)) {
            throw new DomainException("tenant.slug-taken", "This subdomain is already in use");
        }
        Tenant tenant = repository.save(Tenant.signUp(slug, companyName, vertical));
        return toSummary(tenant);
    }

    @Override
    public Optional<TenantSummary> findBySlug(String slug) {
        return repository.findBySlug(slug).map(this::toSummary);
    }

    @Override
    public Optional<TenantSummary> findById(UUID id) {
        return repository.findById(id).map(this::toSummary);
    }

    private TenantSummary toSummary(Tenant tenant) {
        return new TenantSummary(
                tenant.getId(),
                tenant.getSlug(),
                tenant.getName(),
                tenant.getVertical().name(),
                tenant.getStatus().name());
    }
}
