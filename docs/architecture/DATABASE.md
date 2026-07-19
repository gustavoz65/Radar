# Banco de Dados — Omnia

> Status: Ativo · Última revisão: 2026-07-19
> PostgreSQL 16+. Toda mudança via Flyway (`backend/src/main/resources/db/migration`).

## 1. Princípios

1. **Schema único, pool multi-tenant** (ADR-003): `tenant_id UUID NOT NULL` em toda tabela de negócio,
   RLS forçado, política por `current_setting('app.current_tenant_id', true)`.
2. **IDs UUIDv7** gerados na aplicação (ordenáveis por tempo, bons para índice e para offline-first futuro).
3. **Índice composto `(tenant_id, ...)`** em toda tabela desde a criação — nunca retrofit.
4. **Colunas de auditoria** em toda tabela: `created_at`, `updated_at`, `created_by`, `updated_by`;
   `version` (optimistic locking) em agregados editáveis.
5. **Soft delete apenas onde o domínio exige histórico** (`deleted_at`); tabelas append-only
   (auditoria, movimentos de estoque, eventos) nunca sofrem UPDATE/DELETE.
6. **JSONB para personalização** (campos custom, settings, payloads) — nunca para dados relacionais centrais.
7. **Dinheiro**: `NUMERIC(14,2)` + `currency CHAR(3)`; nunca float.
8. **Nomes**: snake_case, singular para colunas, plural para tabelas; FKs `<entidade>_id`;
   domínio de status por `VARCHAR + CHECK` (não enum nativo — evolução mais simples).

## 2. Grupos de tabelas (áreas)

| Área            | Tabelas (v1)                                                                              | Tenant-scoped?                 |
| --------------- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| Tenancy         | `tenants`, `tenant_settings`, `tenant_modules`, `custom_field_definitions`                | `tenants` é global; demais sim |
| Identidade      | `users`, `roles`, `role_permissions`, `user_roles`, `invitations`, `refresh_tokens`       | sim                            |
| Clientes        | `customers`, `customer_contacts`, `customer_assets`, `tags`, `customer_tags`              | sim                            |
| Catálogo        | `service_offerings`, `products`, `categories`                                             | sim                            |
| Agenda          | `appointments`, `appointment_items`, `resources`, `schedule_rules`                        | sim                            |
| Financeiro      | `entries`, `cash_sessions`, `commission_rules`, `commission_entries`, `recurring_charges` | sim                            |
| Vendas          | `sales`, `sale_items`, `sale_payments`, `quotes`, `package_purchases`                     | sim                            |
| Estoque         | `stock_items`, `stock_movements`, `suppliers`, `purchase_orders`                          | sim                            |
| Auditoria       | `audit_events` (append-only, particionável por mês)                                       | sim                            |
| Notificações    | `notification_templates`, `notification_dispatches`                                       | sim                            |
| Arquivos        | `stored_files` (metadados; binário fora do banco)                                         | sim                            |
| Billing (nosso) | `platform_plans`, `platform_subscriptions`                                                | **não** (globais)              |
| Infra           | `flyway_schema_history`, `event_publication` (Modulith outbox)                            | —                              |

## 3. RLS — receita padrão (aplicada por migração)

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;   -- owner também é filtrado
CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
```

- A aplicação conecta com role `omnia_app`, que **não** é owner dos objetos (owner: `omnia_owner`,
  usado só pelo Flyway). Assim nem bug de aplicação nem `FORCE` esquecido vazam dados.
- O `tenant_id` é definido por transação: `SELECT set_config('app.current_tenant_id', ?, true)`
  — seguro com HikariCP e com poolers em transaction mode.
- Tabelas globais (`tenants`, `platform_*`) não têm política de tenant; acesso restrito por permissão
  de aplicação (console administrativo).

## 4. Convenção de migração

- `V<seq>__<verbo>_<alvo>.sql` (ex.: `V3__create_customer_tables.sql`). Uma migração = uma intenção.
- Sem `DROP` destrutivo em produção sem migração de expansão/contração (expand → migrate → contract).
- Repeatable (`R__`) apenas para views/funções idempotentes.
- Toda tabela nova nasce com: RLS + política, índices `(tenant_id, ...)`, colunas de auditoria.

## 5. Escala planejada

1. Índices e query tuning contínuos (pg_stat_statements no compose de dev).
2. Réplica de leitura para relatórios/analytics.
3. Particionamento por range/hash em tabelas quentes (`audit_events`, `appointments`, `stock_movements`).
4. Tenant enterprise → banco dedicado (mesmo schema, mesmas migrações; roteamento por DataSource).
5. Sharding por `tenant_id` apenas como último recurso.

## 6. Backup e retenção

- Backup lógico diário + WAL archiving (RPO ≤ 1h). Testes de restore mensais (runbook em DEPLOYMENT.md).
- Retenção de auditoria: 5 anos; notificações: 6 meses; conforme política LGPD por tabela.
