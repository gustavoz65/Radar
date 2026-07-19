-- Clientes (módulo customer — CRM base). Receita padrão de isolamento: DATABASE.md §3.

CREATE TABLE customers (
    id          UUID PRIMARY KEY,
    tenant_id   UUID          NOT NULL REFERENCES tenants (id),
    name        VARCHAR(160)  NOT NULL,
    email       VARCHAR(160),
    phone       VARCHAR(40),
    notes       VARCHAR(2000),
    status      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE'
                CONSTRAINT customers_status_check CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version     BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX customers_tenant_name_idx ON customers (tenant_id, name);
CREATE INDEX customers_tenant_created_idx ON customers (tenant_id, created_at);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON customers
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
