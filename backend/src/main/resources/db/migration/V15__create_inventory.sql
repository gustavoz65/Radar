-- Estoque (módulo inventory). Saldo (stock_items) é cache derivado dos movimentos (append-only).
-- DATABASE.md §3.

CREATE TABLE stock_items (
    id            UUID PRIMARY KEY,
    tenant_id     UUID         NOT NULL REFERENCES tenants (id),
    product_id    UUID         NOT NULL,
    product_name  VARCHAR(160) NOT NULL,
    quantity      INTEGER      NOT NULL DEFAULT 0,
    min_quantity  INTEGER      NOT NULL DEFAULT 0,
    version       BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT stock_items_product_unique UNIQUE (tenant_id, product_id)
);
CREATE INDEX stock_items_tenant_name_idx ON stock_items (tenant_id, product_name);

CREATE TABLE stock_movements (
    id             UUID PRIMARY KEY,
    tenant_id      UUID         NOT NULL REFERENCES tenants (id),
    stock_item_id  UUID         NOT NULL REFERENCES stock_items (id),
    type           VARCHAR(10)  NOT NULL CHECK (type IN ('IN','OUT','ADJUST')),
    amount         INTEGER      NOT NULL CHECK (amount > 0),
    reason         VARCHAR(200) NOT NULL DEFAULT '-',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_tenant_item_idx ON stock_movements (tenant_id, stock_item_id, created_at DESC);

ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON stock_items
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON stock_movements
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
