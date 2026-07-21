-- Trilha de auditoria append-only (módulo audit, LGPD). Sem UPDATE/DELETE em produção.
-- Particionável por mês no futuro (DATABASE.md §5).

CREATE TABLE audit_events (
    id             UUID PRIMARY KEY,
    tenant_id      UUID         NOT NULL REFERENCES tenants (id),
    actor_user_id  UUID,
    action         VARCHAR(80)  NOT NULL,
    entity_type    VARCHAR(60)  NOT NULL,
    entity_id      UUID,
    summary        VARCHAR(500) NOT NULL,
    occurred_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_tenant_occurred_idx ON audit_events (tenant_id, occurred_at DESC);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_events
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
