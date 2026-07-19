-- Registro global de tenants (DOMAIN.md §Tenancy). Sem RLS: esta tabela É o registro de tenants;
-- o acesso é restrito por permissão de aplicação (console/da própria plataforma).

CREATE TABLE tenants (
    id          UUID PRIMARY KEY,
    slug        VARCHAR(40)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    vertical    VARCHAR(30)  NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'TRIAL'
                CONSTRAINT tenants_status_check
                CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED')),
    timezone    VARCHAR(60)  NOT NULL DEFAULT 'America/Sao_Paulo',
    locale      VARCHAR(10)  NOT NULL DEFAULT 'pt-BR',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version     BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT tenants_slug_unique UNIQUE (slug)
);

COMMENT ON TABLE tenants IS 'Global tenant registry — the boundary of all data isolation (ADR-003)';
