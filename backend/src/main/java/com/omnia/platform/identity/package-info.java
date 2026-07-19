/**
 * Identity module: user accounts, authentication (JWT — ADR-008) and, next, roles/permissions.
 * Users belong to exactly one tenant; all identity tables are tenant-scoped under RLS.
 *
 * <p>Public API: {@link com.omnia.platform.identity.UserAccounts}.
 */
package com.omnia.platform.identity;
