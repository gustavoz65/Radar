package com.omnia.platform.tenant.application.usecase;

import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import com.omnia.platform.tenant.application.port.out.TenantRepository;
import com.omnia.platform.tenant.application.port.out.TenantSettingsRepository;
import com.omnia.platform.tenant.domain.model.TenantSettings;
import com.omnia.platform.tenant.domain.model.VerticalPresets;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenantSettingsUseCases {

    private final TenantSettingsRepository settings;
    private final TenantRepository tenants;

    public TenantSettingsUseCases(TenantSettingsRepository settings, TenantRepository tenants) {
        this.settings = settings;
        this.tenants = tenants;
    }

    /** Returns the current tenant's settings, seeding defaults (from the vertical preset) on first access. */
    @Transactional
    public TenantSettings current() {
        var tenantId = TenantContext.require();
        return settings.findById(tenantId).orElseGet(() -> {
            var tenant = tenants.findById(tenantId)
                    .orElseThrow(() -> new NotFoundException("tenant.not-found", "Tenant not found"));
            return settings.save(TenantSettings.defaults(tenantId, VerticalPresets.customerTerm(tenant.getVertical())));
        });
    }

    @Transactional
    public TenantSettings update(Command command) {
        TenantSettings current = current();
        current.update(
                command.brandColor(),
                command.logoUrl(),
                command.defaultTheme(),
                command.openingHour(),
                command.closingHour(),
                command.customerTerm());
        return settings.save(current);
    }

    public record Command(
            String brandColor,
            String logoUrl,
            String defaultTheme,
            int openingHour,
            int closingHour,
            String customerTerm) {}
}
