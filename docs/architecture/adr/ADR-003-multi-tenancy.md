# ADR-003 — Multi-tenancy: pool (shared schema) com PostgreSQL RLS

- Status: Aceito · Data: 2026-07-19

## Contexto

Milhares de tenants SMB previstos; isolamento de dados é requisito absoluto; custo de infraestrutura
por tenant precisa ser mínimo. Modelos possíveis: silo (banco por tenant), bridge (schema por tenant),
pool (schema compartilhado).

## Decisão

**Pool**: schema único, `tenant_id UUID NOT NULL` em toda tabela de negócio, com defesa em profundidade:

1. **Aplicação**: `TenantContext` por request (resolvido do JWT) + filtro Hibernate obrigatório.
2. **Banco**: RLS com `ENABLE` + `FORCE ROW LEVEL SECURITY` e política
   `tenant_id = current_setting('app.current_tenant_id', true)::uuid`, setada **por transação**
   com `set_config(..., true)` (à prova de pool de conexões).
3. **Privilégios**: role de aplicação (`omnia_app`) não é owner dos objetos; owner (`omnia_owner`)
   é usado apenas pelo Flyway. Owner não sofre bypass graças ao FORCE, e o app não pode alterar políticas.
4. Índices compostos `(tenant_id, …)` em toda tabela desde a criação.

## Justificativa

Consenso técnico 2026 para B2B SMB (AWS, Nile, etc.): menor COGS (3–5x vs silo), migração única,
onboarding instantâneo; RLS bem configurado dá isolamento forte. Trilha de escala documentada em
DATABASE.md §5, incluindo banco dedicado para tenants enterprise (mesmas migrações, DataSource roteado).

## Consequências

- (+) Custo mínimo por tenant; operação simples; um schema para evoluir.
- (−) Blast radius físico compartilhado → mitigado por RLS + backups + testes de isolamento automáticos
  (suite que tenta cross-tenant e deve falhar) no CI.
- (−) Restore por tenant é seletivo (via `tenant_id`), não por banco — runbook próprio.
