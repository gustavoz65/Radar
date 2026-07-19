package com.omnia.platform.shared.tenancy;

import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Rebinds the PostgreSQL tenant setting in the middle of an open transaction.
 *
 * <p>{@link TenantAwareDataSource} stamps the tenant at connection checkout; flows that only learn
 * the definitive tenant id inside the transaction (e.g. signup, where the aggregate generates its
 * id) must call {@link #bindTransaction} before touching RLS-protected tables. Uses
 * {@code set_config(..., true)} — transaction-local, reverts on commit/rollback.
 */
@Component
public class TenantSession {

    private final JdbcTemplate jdbc;

    public TenantSession(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void bindTransaction(UUID tenantId) {
        TenantContext.set(tenantId);
        jdbc.queryForObject("SELECT set_config('app.current_tenant_id', ?, true)", String.class, tenantId.toString());
    }
}
