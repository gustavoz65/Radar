package com.omnia.platform.tenant;

import java.util.Optional;
import java.util.UUID;

/**
 * Public API of the tenant module, consumable by other modules (never their adapters directly —
 * ADR-002).
 */
public interface Tenants {

    /**
     * Registers a new tenant in TRIAL status. Throws {@code tenant.slug-taken} when the slug is in
     * use. Joins the caller's transaction when one is active.
     */
    TenantSummary signUp(String slug, String companyName, Vertical vertical);

    Optional<TenantSummary> findBySlug(String slug);

    Optional<TenantSummary> findById(UUID id);

    /** Read model exposed across module boundaries. */
    record TenantSummary(UUID id, String slug, String name, String vertical, String status) {}
}
