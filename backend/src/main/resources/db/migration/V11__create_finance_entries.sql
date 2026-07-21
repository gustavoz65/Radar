-- Lançamentos financeiros (módulo finance). Referência fraca à venda (source_type/source_id),
-- nunca FK cruzando módulos (DOMAIN.md §Finance). DATABASE.md §3.

CREATE TABLE finance_entries (
    id           UUID PRIMARY KEY,
    tenant_id    UUID          NOT NULL REFERENCES tenants (id),
    type         VARCHAR(10)   NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
    category     VARCHAR(80)   NOT NULL,
    description  VARCHAR(200)  NOT NULL,
    amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    due_date     DATE          NOT NULL,
    status       VARCHAR(10)   NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SETTLED')),
    source_type  VARCHAR(30),
    source_id    UUID,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version      BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX finance_entries_tenant_due_idx ON finance_entries (tenant_id, due_date DESC);

ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON finance_entries
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
