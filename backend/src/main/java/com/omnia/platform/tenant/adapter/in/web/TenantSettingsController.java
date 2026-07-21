package com.omnia.platform.tenant.adapter.in.web;

import com.omnia.platform.tenant.application.usecase.TenantSettingsUseCases;
import com.omnia.platform.tenant.domain.model.TenantSettings;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenant/settings")
@Tag(name = "Tenant Settings", description = "Branding, working hours and terminology")
class TenantSettingsController {

    private final TenantSettingsUseCases useCases;

    TenantSettingsController(TenantSettingsUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping
    @Operation(summary = "Get the current tenant's settings")
    SettingsResponse get() {
        return SettingsResponse.from(useCases.current());
    }

    @PutMapping
    @Operation(summary = "Update the current tenant's settings")
    SettingsResponse update(@RequestBody @Valid SettingsRequest request) {
        return SettingsResponse.from(useCases.update(new TenantSettingsUseCases.Command(
                request.brandColor(),
                request.logoUrl(),
                request.defaultTheme(),
                request.openingHour(),
                request.closingHour(),
                request.customerTerm())));
    }

    record SettingsRequest(
            @NotBlank @Pattern(regexp = "#[0-9a-fA-F]{6}") String brandColor,
            @Size(max = 500) String logoUrl,
            @Pattern(regexp = "system|light|dark") String defaultTheme,
            @Min(0) @Max(23) int openingHour,
            @Min(1) @Max(24) int closingHour,
            @NotBlank @Size(max = 40) String customerTerm) {}

    record SettingsResponse(
            String brandColor,
            String logoUrl,
            String defaultTheme,
            int openingHour,
            int closingHour,
            String customerTerm) {

        static SettingsResponse from(TenantSettings settings) {
            return new SettingsResponse(
                    settings.getBrandColor(),
                    settings.getLogoUrl(),
                    settings.getDefaultTheme(),
                    settings.getOpeningHour(),
                    settings.getClosingHour(),
                    settings.getCustomerTerm());
        }
    }
}
