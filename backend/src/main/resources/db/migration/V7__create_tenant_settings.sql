-- Configurações por tenant (branding, horários, terminologia). Uma linha por tenant.
-- Chave = tenant_id (também o discriminador de RLS). DATABASE.md §3.

CREATE TABLE tenant_settings (
    tenant_id      UUID PRIMARY KEY REFERENCES tenants (id),
    brand_color    VARCHAR(7)   NOT NULL DEFAULT '#7c3aed',
    logo_url       VARCHAR(500),
    default_theme  VARCHAR(10)  NOT NULL DEFAULT 'system'
                   CONSTRAINT tenant_settings_theme_check CHECK (default_theme IN ('system','light','dark')),
    opening_hour   INTEGER      NOT NULL DEFAULT 9  CHECK (opening_hour BETWEEN 0 AND 23),
    closing_hour   INTEGER      NOT NULL DEFAULT 19 CHECK (closing_hour BETWEEN 1 AND 24),
    customer_term  VARCHAR(40)  NOT NULL DEFAULT 'Cliente',
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version        BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT tenant_settings_hours_check CHECK (closing_hour > opening_hour)
);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_settings
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
