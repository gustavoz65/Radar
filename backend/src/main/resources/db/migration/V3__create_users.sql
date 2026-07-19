-- Usuários (módulo identity). Tenant-scoped: RLS + índice composto por tenant (DATABASE.md §3).

CREATE TABLE users (
    id             UUID PRIMARY KEY,
    tenant_id      UUID         NOT NULL REFERENCES tenants (id),
    name           VARCHAR(120) NOT NULL,
    email          VARCHAR(160) NOT NULL,
    password_hash  VARCHAR(300) NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                   CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'INACTIVE')),
    is_owner       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version        BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT users_email_unique_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX users_tenant_created_idx ON users (tenant_id, created_at);

-- Receita padrão de isolamento (DATABASE.md §3):
-- comparação por texto para "fail closed" sem erro de cast quando o contexto está vazio.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
