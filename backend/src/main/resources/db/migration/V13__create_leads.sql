-- Leads / funil (módulo crm). DATABASE.md §3.

CREATE TABLE leads (
    id           UUID PRIMARY KEY,
    tenant_id    UUID         NOT NULL REFERENCES tenants (id),
    name         VARCHAR(160) NOT NULL,
    contact      VARCHAR(160),
    source       VARCHAR(60),
    notes        VARCHAR(500),
    stage        VARCHAR(20)  NOT NULL DEFAULT 'NEW'
                 CONSTRAINT leads_stage_check CHECK (stage IN ('NEW','CONTACTED','QUALIFIED','WON','LOST')),
    lost_reason  VARCHAR(200),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version      BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX leads_tenant_stage_idx ON leads (tenant_id, stage);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON leads
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
