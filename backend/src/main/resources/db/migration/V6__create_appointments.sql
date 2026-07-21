-- Agenda (módulo scheduling). Referências entre módulos são fracas (sem FK para customers/users
-- de outros módulos — DOMAIN.md §3); snapshots de nomes preservam a história.

CREATE TABLE appointments (
    id                    UUID PRIMARY KEY,
    tenant_id             UUID          NOT NULL REFERENCES tenants (id),
    customer_id           UUID          NOT NULL,
    customer_name         VARCHAR(160)  NOT NULL,
    professional_user_id  UUID          NOT NULL,
    professional_name     VARCHAR(120)  NOT NULL,
    service_id            UUID          NOT NULL,
    service_name          VARCHAR(160)  NOT NULL,
    price                 NUMERIC(12,2) NOT NULL,
    start_time            TIMESTAMPTZ   NOT NULL,
    end_time              TIMESTAMPTZ   NOT NULL,
    status                VARCHAR(20)   NOT NULL DEFAULT 'SCHEDULED'
                          CONSTRAINT appointments_status_check CHECK
                          (status IN ('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
    notes                 VARCHAR(500),
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    version               BIGINT        NOT NULL DEFAULT 0,
    CONSTRAINT appointments_period_check CHECK (end_time > start_time)
);

CREATE INDEX appointments_tenant_start_idx ON appointments (tenant_id, start_time);
CREATE INDEX appointments_tenant_professional_start_idx
    ON appointments (tenant_id, professional_user_id, start_time);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON appointments
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
