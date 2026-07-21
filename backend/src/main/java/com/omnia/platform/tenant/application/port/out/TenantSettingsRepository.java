package com.omnia.platform.tenant.application.port.out;

import com.omnia.platform.tenant.domain.model.TenantSettings;
import java.util.Optional;
import java.util.UUID;

public interface TenantSettingsRepository {

    TenantSettings save(TenantSettings settings);

    Optional<TenantSettings> findById(UUID tenantId);
}
