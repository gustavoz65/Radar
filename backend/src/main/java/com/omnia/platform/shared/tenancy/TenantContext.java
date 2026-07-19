package com.omnia.platform.shared.tenancy;

import java.util.Optional;
import java.util.UUID;

/**
 * Holds the tenant of the current unit of work (request thread or explicit scope).
 *
 * <p>Set by the authentication filter (from the JWT {@code tenant_id} claim) or explicitly by
 * system-level flows (signup, platform console, scheduled jobs iterating tenants). The value feeds
 * the PostgreSQL {@code app.current_tenant_id} setting used by Row-Level Security policies — see
 * ADR-003.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(UUID tenantId) {
        CURRENT.set(tenantId);
    }

    public static Optional<UUID> get() {
        return Optional.ofNullable(CURRENT.get());
    }

    public static UUID require() {
        UUID tenantId = CURRENT.get();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant bound to the current context");
        }
        return tenantId;
    }

    public static void clear() {
        CURRENT.remove();
    }

    /** Runs the given action with the given tenant bound, restoring the previous binding after. */
    public static void runAs(UUID tenantId, Runnable action) {
        UUID previous = CURRENT.get();
        try {
            CURRENT.set(tenantId);
            action.run();
        } finally {
            if (previous == null) {
                CURRENT.remove();
            } else {
                CURRENT.set(previous);
            }
        }
    }
}
