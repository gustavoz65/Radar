-- Projeção de analytics (módulo analytics, CQRS-lite). Read-model construído por eventos.
-- DATABASE.md §3.

CREATE TABLE analytics_daily_stats (
    id            UUID PRIMARY KEY,
    tenant_id     UUID          NOT NULL REFERENCES tenants (id),
    stat_date     DATE          NOT NULL,
    appointments  INTEGER       NOT NULL DEFAULT 0,
    revenue       NUMERIC(14,2) NOT NULL DEFAULT 0,
    version       BIGINT        NOT NULL DEFAULT 0,
    CONSTRAINT analytics_daily_unique UNIQUE (tenant_id, stat_date)
);

CREATE INDEX analytics_daily_tenant_date_idx ON analytics_daily_stats (tenant_id, stat_date);

ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_stats FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON analytics_daily_stats
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
