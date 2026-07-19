-- Roles de banco (dev local). Em produção, criados pelo provisionamento de infra.
-- omnia_owner: dono dos objetos, usado APENAS pelo Flyway (já é o POSTGRES_USER do container).
-- omnia_app:   role da aplicação — NÃO é owner; sujeita a RLS (FORCE) e sem poder de DDL.
CREATE ROLE omnia_app LOGIN PASSWORD 'omnia_app_local_dev';
GRANT CONNECT ON DATABASE omnia TO omnia_app;
GRANT USAGE ON SCHEMA public TO omnia_app;
-- Privilégios de DML concedidos por migração Flyway (ALTER DEFAULT PRIVILEGES + GRANTs),
-- garantindo que valem em qualquer ambiente, não só no compose local.
