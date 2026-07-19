# Guia de Deploy — Omnia

> Status: Ativo · Última revisão: 2026-07-19

## Ambientes

| Ambiente   | Infra                                                                               | Deploy                        | Dados                |
| ---------- | ----------------------------------------------------------------------------------- | ----------------------------- | -------------------- |
| local      | Docker Compose (`make up`)                                                          | manual                        | descartáveis (seeds) |
| staging    | container registry + orquestrador (Fly.io/Render/K8s — decidir na Fase 1 por custo) | automático em merge na `main` | anonimizados         |
| production | idem staging + Postgres gerenciado (RDS/Neon/Cloud SQL) com PITR                    | por tag `v*` com aprovação    | reais, LGPD          |

## Pipeline (GitHub Actions)

1. PR: lint + build + testes (Testcontainers) + fronteiras Modulith + cobertura + Sonar (quando ativo).
2. Merge em `main`: build da imagem Docker (backend e frontend), push no registry com SHA.
3. Tag `v*` (SemVer): deploy staging → smoke tests → aprovação manual → production.
4. Migrações Flyway rodam no startup da aplicação com role `omnia_owner` (aplicação usa `omnia_app`).
   Migrações são sempre backward-compatible com a versão anterior (expand/contract) para permitir
   rollback de app sem rollback de banco.

## Configuração

Toda configuração por variável de ambiente (12-factor). Ver `backend/src/main/resources/application.yml`
para o catálogo (`OMNIA_DB_URL`, `OMNIA_DB_APP_USER`, `OMNIA_JWT_*`, `OMNIA_REDIS_URL`, ...).
Segredos: secret manager do provedor; nunca em git.

## Operação

- Health: `/actuator/health` (liveness/readiness) · Métricas: `/actuator/prometheus`.
- Logs JSON → agregador (Loki/CloudWatch). Todo log tem `tenant_id` e `trace_id`.
- Backup: dump lógico diário + WAL/PITR (RPO ≤ 1h). **Teste de restore mensal** (runbook abaixo).
- Rollback de app: redeploy da tag anterior (migrações são compatíveis por regra).

## Runbooks (a expandir na Fase 1)

- Restore de banco: provisionar instância a partir de PITR → validar → trocar DNS interno.
- Suspensão de tenant: status SUSPENDED bloqueia login e API; dados intactos.
- Exclusão LGPD de tenant: export → anonimização/purga por `tenant_id` → registro de execução.
