-- Ordens de serviço (módulo workorder). DATABASE.md §3.

CREATE TABLE work_orders (
    id             UUID PRIMARY KEY,
    tenant_id      UUID         NOT NULL REFERENCES tenants (id),
    customer_id    UUID         NOT NULL,
    customer_name  VARCHAR(160) NOT NULL,
    title          VARCHAR(160) NOT NULL,
    description    VARCHAR(1000),
    status         VARCHAR(20)  NOT NULL DEFAULT 'OPEN'
                   CONSTRAINT work_orders_status_check
                   CHECK (status IN ('OPEN','APPROVED','IN_PROGRESS','DONE','DELIVERED','CANCELLED')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version        BIGINT       NOT NULL DEFAULT 0
);
CREATE INDEX work_orders_tenant_created_idx ON work_orders (tenant_id, created_at DESC);

CREATE TABLE work_order_items (
    id             UUID PRIMARY KEY,
    work_order_id  UUID          NOT NULL REFERENCES work_orders (id) ON DELETE CASCADE,
    description    VARCHAR(200)  NOT NULL,
    quantity       INTEGER       NOT NULL CHECK (quantity >= 1),
    unit_price     NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0)
);
CREATE INDEX work_order_items_wo_idx ON work_order_items (work_order_id);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON work_orders
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON work_order_items
    USING (EXISTS (SELECT 1 FROM work_orders w WHERE w.id = work_order_id
                   AND w.tenant_id::text = current_setting('app.current_tenant_id', true)))
    WITH CHECK (EXISTS (SELECT 1 FROM work_orders w WHERE w.id = work_order_id
                   AND w.tenant_id::text = current_setting('app.current_tenant_id', true)));
