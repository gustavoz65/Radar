-- Papéis de banco e privilégios (ADR-003).
-- Executado pelo Flyway com a role dona do schema (omnia_owner).
-- omnia_app: role da aplicação — NÃO é owner dos objetos, portanto sujeita a RLS (com FORCE)
-- e sem capacidade de alterar políticas. Em produção a role já existe (criada pela infra com
-- senha forte) e o bloco abaixo é um no-op.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'omnia_app') THEN
        CREATE ROLE omnia_app LOGIN PASSWORD 'omnia_app_local_dev';
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO omnia_app;

-- Objetos criados a partir daqui (pelas migrações seguintes) ficam acessíveis à aplicação.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO omnia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO omnia_app;
