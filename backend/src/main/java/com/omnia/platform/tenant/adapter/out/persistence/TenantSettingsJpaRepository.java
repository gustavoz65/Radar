package com.omnia.platform.tenant.adapter.out.persistence;

import com.omnia.platform.tenant.application.port.out.TenantSettingsRepository;
import com.omnia.platform.tenant.domain.model.TenantSettings;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantSettingsJpaRepository extends TenantSettingsRepository, JpaRepository<TenantSettings, UUID> {}
