package com.omnia.platform.tenant.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Per-tenant branding and operational preferences. Separate aggregate from {@link Tenant} because
 * it changes often and by different actors (DOMAIN.md §Tenancy). One row per tenant, keyed by
 * tenant id (which is also the RLS discriminator).
 */
@Entity
@Table(name = "tenant_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TenantSettings {

    @Id
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "brand_color", nullable = false)
    private String brandColor;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "default_theme", nullable = false)
    private String defaultTheme;

    /** Opening hour of the working day (0-23), used as the agenda's default view start. */
    @Column(name = "opening_hour", nullable = false)
    private int openingHour;

    @Column(name = "closing_hour", nullable = false)
    private int closingHour;

    @Column(name = "customer_term", nullable = false)
    private String customerTerm;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private TenantSettings(UUID tenantId, String customerTerm) {
        this.tenantId = tenantId;
        this.brandColor = "#7c3aed";
        this.defaultTheme = "system";
        this.openingHour = 9;
        this.closingHour = 19;
        this.customerTerm = customerTerm;
        this.updatedAt = Instant.now();
    }

    public static TenantSettings defaults(UUID tenantId, String customerTerm) {
        return new TenantSettings(tenantId, customerTerm);
    }

    public void update(
            String brandColor,
            String logoUrl,
            String defaultTheme,
            int openingHour,
            int closingHour,
            String customerTerm) {
        if (brandColor == null || !brandColor.matches("#[0-9a-fA-F]{6}")) {
            throw new DomainException("settings.invalid-color", "Brand color must be a hex value like #7c3aed");
        }
        if (openingHour < 0 || openingHour > 23 || closingHour < 1 || closingHour > 24 || closingHour <= openingHour) {
            throw new DomainException("settings.invalid-hours", "Closing hour must be after opening hour (0-24)");
        }
        if (!defaultTheme.equals("system") && !defaultTheme.equals("light") && !defaultTheme.equals("dark")) {
            throw new DomainException("settings.invalid-theme", "Theme must be system, light or dark");
        }
        this.brandColor = brandColor;
        this.logoUrl = logoUrl == null || logoUrl.isBlank() ? null : logoUrl.trim();
        this.defaultTheme = defaultTheme;
        this.openingHour = openingHour;
        this.closingHour = closingHour;
        this.customerTerm = customerTerm == null || customerTerm.isBlank() ? this.customerTerm : customerTerm.trim();
        this.updatedAt = Instant.now();
    }
}
