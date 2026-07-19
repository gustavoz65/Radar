/**
 * Tenant module: tenant lifecycle (signup, status), settings, enabled modules and per-tenant
 * personalization. The {@code tenants} table is global (no RLS) — it IS the tenant registry.
 *
 * <p>Public API: {@link com.omnia.platform.tenant.Tenants}.
 */
package com.omnia.platform.tenant;
