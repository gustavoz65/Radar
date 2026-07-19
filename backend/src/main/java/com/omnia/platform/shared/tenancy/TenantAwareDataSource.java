package com.omnia.platform.shared.tenancy;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.springframework.jdbc.datasource.DelegatingDataSource;

/**
 * Applies the current tenant to every connection checked out from the pool by setting the
 * PostgreSQL session variable {@code app.current_tenant_id}, which RLS policies compare against
 * (ADR-003).
 *
 * <p>When no tenant is bound, the variable is set to the empty string: policies compare
 * {@code tenant_id::text = current_setting('app.current_tenant_id', true)}, so an unbound context
 * matches no rows — the system fails closed.
 */
public class TenantAwareDataSource extends DelegatingDataSource {

    public TenantAwareDataSource(DataSource delegate) {
        super(delegate);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return prepare(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return prepare(super.getConnection(username, password));
    }

    private Connection prepare(Connection connection) throws SQLException {
        String tenant = TenantContext.get().map(Object::toString).orElse("");
        try (Statement statement = connection.createStatement()) {
            statement.execute("SELECT set_config('app.current_tenant_id', '" + sanitize(tenant) + "', false)");
        }
        return connection;
    }

    private String sanitize(String value) {
        // Value is either empty or a UUID rendered by Java; this guard is defense in depth only.
        if (!value.isEmpty() && !value.matches("[0-9a-fA-F-]{36}")) {
            throw new IllegalStateException("Invalid tenant identifier");
        }
        return value;
    }
}
