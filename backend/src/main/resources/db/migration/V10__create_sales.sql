-- Vendas/comandas (módulo sales). DATABASE.md §3. Itens e pagamentos referenciam a venda por FK
-- interna (mesmo módulo); catálogo/cliente são referências fracas (snapshot).

CREATE TABLE sales (
    id             UUID PRIMARY KEY,
    tenant_id      UUID          NOT NULL REFERENCES tenants (id),
    customer_id    UUID,
    customer_name  VARCHAR(160),
    status         VARCHAR(20)   NOT NULL DEFAULT 'OPEN'
                   CONSTRAINT sales_status_check CHECK (status IN ('OPEN','PAID','CANCELLED')),
    discount       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    completed_at   TIMESTAMPTZ,
    version        BIGINT        NOT NULL DEFAULT 0
);
CREATE INDEX sales_tenant_created_idx ON sales (tenant_id, created_at DESC);

CREATE TABLE sale_items (
    id           UUID PRIMARY KEY,
    sale_id      UUID          NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
    kind         VARCHAR(10)   NOT NULL CHECK (kind IN ('SERVICE','PRODUCT')),
    reference_id UUID,
    description  VARCHAR(200)  NOT NULL,
    quantity     INTEGER       NOT NULL CHECK (quantity >= 1),
    unit_price   NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0)
);
CREATE INDEX sale_items_sale_idx ON sale_items (sale_id);

CREATE TABLE sale_payments (
    id       UUID PRIMARY KEY,
    sale_id  UUID          NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
    method   VARCHAR(30)   NOT NULL,
    amount   NUMERIC(12,2) NOT NULL CHECK (amount > 0)
);
CREATE INDEX sale_payments_sale_idx ON sale_payments (sale_id);

-- RLS: sales tem tenant_id direto; itens/pagamentos herdam via join com sales na aplicação,
-- mas ativamos RLS neles também por defesa, comparando através do sale pai.
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sales
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Itens e pagamentos: isolados pelo tenant do sale pai.
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sale_items
    USING (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id
                   AND s.tenant_id::text = current_setting('app.current_tenant_id', true)))
    WITH CHECK (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id
                   AND s.tenant_id::text = current_setting('app.current_tenant_id', true)));

ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sale_payments
    USING (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id
                   AND s.tenant_id::text = current_setting('app.current_tenant_id', true)))
    WITH CHECK (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_id
                   AND s.tenant_id::text = current_setting('app.current_tenant_id', true)));
