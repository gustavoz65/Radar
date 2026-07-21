-- Catálogo: serviços e produtos (módulo catalog). Receita de isolamento: DATABASE.md §3.

CREATE TABLE service_offerings (
    id                UUID PRIMARY KEY,
    tenant_id         UUID          NOT NULL REFERENCES tenants (id),
    name              VARCHAR(160)  NOT NULL,
    description       VARCHAR(500),
    duration_minutes  INTEGER       NOT NULL CHECK (duration_minutes BETWEEN 5 AND 1440),
    price             NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    active            BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version           BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX service_offerings_tenant_name_idx ON service_offerings (tenant_id, name);

ALTER TABLE service_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_offerings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON service_offerings
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE TABLE products (
    id          UUID PRIMARY KEY,
    tenant_id   UUID          NOT NULL REFERENCES tenants (id),
    name        VARCHAR(160)  NOT NULL,
    sku         VARCHAR(60),
    price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    cost        NUMERIC(12,2) CHECK (cost >= 0),
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version     BIGINT        NOT NULL DEFAULT 0
);

CREATE INDEX products_tenant_name_idx ON products (tenant_id, name);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
