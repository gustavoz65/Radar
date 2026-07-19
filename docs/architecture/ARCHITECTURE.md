# Arquitetura — Omnia Platform

> Status: Ativo · Última revisão: 2026-07-19
> Decisões formais em [adr/](./adr/). Este documento é o mapa; os ADRs são a lei.

## 1. Visão geral

Omnia é um **monólito modular** (Spring Modulith) exposto por uma API REST, com frontend Angular
servido separadamente, PostgreSQL como fonte de verdade, Redis para cache/filas leves, e
comunicação interna entre módulos por **eventos de domínio** (in-process, com relay transacional).

```
┌────────────────────────┐        ┌───────────────────────────────────────────┐
│  Angular SPA           │  HTTPS │  Spring Boot (Modulith)                   │
│  (Material+Tailwind)   ├───────►│  ┌──────── módulos de negócio ─────────┐  │
│  app.omnia / *.omnia   │        │  │ tenant │ identity │ customer │ ...  │  │
└────────────────────────┘        │  └───────────┬─────────────────────────┘  │
        ▲                         │   shared kernel (tenancy, events, money)  │
        │ agendamento público     └──────┬─────────────────┬──────────────────┘
   (páginas públicas do tenant)          │                 │
                                  ┌──────▼──────┐   ┌──────▼──────┐
                                  │ PostgreSQL  │   │   Redis     │
                                  │ (RLS/tenant)│   │ cache/filas │
                                  └─────────────┘   └─────────────┘
```

## 2. Estilo arquitetural

- **Monólito modular primeiro** (ADR-002): um deployable, fronteiras de módulo rígidas verificadas
  por testes (Spring Modulith + ArchUnit). Extração futura de microservices por módulo, guiada por dor real.
- **Hexagonal / Ports & Adapters + DDD** dentro de cada módulo (ADR-004):

```
com.omnia.platform.<módulo>/
├── domain/          # Entidades, VOs, agregados, eventos, regras. Zero Spring/JPA aqui? →
│   │                #   pragmático: JPA permitido em entidades (ADR-004 §compromissos)
│   ├── model/
│   ├── event/
│   └── service/     # Domain services
├── application/     # Casos de uso (ports de entrada), transações, orquestração
│   ├── port/        #   in/ (use cases) e out/ (repositórios, gateways)
│   └── usecase/
├── adapter/
│   ├── in/web/      # Controllers REST, DTOs de request/response, mappers (MapStruct)
│   └── out/         # persistence/ (JPA), messaging/, integration/ (http clients)
└── package-info.java  # @ApplicationModule — fronteira Modulith
```

- **Regra de dependência**: `adapter → application → domain`. Módulos só se comunicam por
  (a) API pública do módulo (interface exposta) ou (b) eventos de domínio. Nunca por repositório alheio.
- **CQRS leve** onde fizer sentido (relatórios/dashboards leem projeções otimizadas; escrita passa
  por agregados). Sem event sourcing (ADR-006).

## 3. Módulos (mapa atual e planejado)

| Módulo         | Responsabilidade                                                           | Fase |
| -------------- | -------------------------------------------------------------------------- | ---- |
| `shared`       | Kernel: TenantContext, DomainEvent base, Money, IDs, exceções, validação   | 0    |
| `tenant`       | Tenants, planos, módulos habilitados, configurações, personalização        | 0    |
| `identity`     | Usuários, autenticação (JWT/OAuth2), papéis, permissões, convites          | 0    |
| `customer`     | Clientes, contatos, vínculos (pet/veículo/dependente), tags, campos custom | 1    |
| `catalog`      | Produtos e serviços, categorias, preços                                    | 1    |
| `scheduling`   | Agenda, agendamentos, recursos, disponibilidade, agendamento online        | 1    |
| `notification` | Templates, envio multi-canal, centro de notificações                       | 1    |
| `audit`        | Trilha de auditoria, LGPD                                                  | 1    |
| `sales`        | Vendas, comandas, orçamentos, pacotes                                      | 2    |
| `finance`      | Contas, caixa, comissões, recorrência, conciliação                         | 2    |
| `billing`      | Assinatura da plataforma (nosso faturamento)                               | 2    |
| `analytics`    | Projeções de leitura, relatórios, dashboards                               | 2    |
| `ai`           | Gateway de IA, assistente, previsões                                       | 2+   |
| `inventory`    | Estoque, compras, fornecedores                                             | 3    |
| `workorder`    | Ordens de serviço                                                          | 3    |
| `crm` (leads)  | Leads, funis, atividades                                                   | 3    |
| `automation`   | Motor de workflows, webhooks                                               | 3    |
| `integration`  | API pública, API keys, integrações externas                                | 3    |

## 4. Multi-tenancy (ADR-003)

- **Modelo pool**: schema único, coluna `tenant_id UUID NOT NULL` em toda tabela de negócio.
- **Defesa em profundidade**:
  1. Filtro de aplicação: `TenantContext` (ThreadLocal/escopo de request) alimenta Hibernate filter.
  2. **PostgreSQL RLS com `FORCE ROW LEVEL SECURITY`** e política sobre `current_setting('app.current_tenant_id')`,
     setada por transação (`set_config(..., true)`) — segura sob pool de conexões.
  3. Usuário de banco da aplicação **não é** owner das tabelas (não bypassa RLS).
- Resolução do tenant: subdomínio (`empresa.omnia.app`) → claim `tenant_id` no JWT → header interno.
  O JWT é a fonte de verdade; o subdomínio apenas roteia a tela de login.
- Índices compostos `(tenant_id, ...)` em toda tabela desde o dia 1.
- Trilha de escala: réplicas de leitura → particionamento de tabelas quentes → banco dedicado para
  tenants enterprise (o design com `tenant_id` + Flyway permite) → sharding por último.

## 5. Segurança

- AuthN: JWT curto (15 min) + refresh token rotativo httpOnly; senhas com Argon2id; OAuth2 social depois.
- AuthZ: RBAC por permissão (`module:action`), avaliada em anotação nos casos de uso + method security.
- LGPD: auditoria imutável, consentimento, anonimização; PII criptografada em repouso quando sensível.
- OWASP ASVS como checklist; headers de segurança; rate limiting por IP+tenant (Redis).
- Segredos: variáveis de ambiente / secret manager. Nunca em código ou git.

## 6. Dados e eventos

- PostgreSQL 16+ como fonte de verdade; Flyway para toda mudança de schema (ADR-005).
- Eventos de domínio via Spring Modulith `ApplicationModuleListener` com **event publication registry**
  (garante entrega após commit; outbox pattern embutido).
- Redis: cache (Spring Cache), rate limiting, locks; filas leves. Broker dedicado só quando necessário.
- Arquivos: abstração `FileStoragePort` — dev: MinIO/disco; prod: S3-compatível.

## 7. Observabilidade

- Logs estruturados JSON com `tenant_id`, `user_id`, `trace_id` em todo log (MDC).
- Métricas: Actuator + Micrometer → Prometheus. Tracing: OpenTelemetry.
- Health checks: liveness/readiness para orquestração.

## 8. Frontend (ADR-007)

- Angular (standalone components, signals, controle de fluxo `@if/@for`), Angular Material + Tailwind.
- Estado: signals + services; sem NgRx até haver complexidade que o justifique.
- Lazy loading por módulo de negócio espelhando o backend; guards por permissão; resolvers para dados críticos.
- Tema dinâmico por tenant (CSS custom properties geradas das cores do tenant); dark/light.
- SSR apenas nas páginas públicas (agendamento online, site do tenant) — app logada é SPA.

## 9. CI/CD e ambientes

- GitHub Actions: build+testes+lint em todo PR; imagem Docker por merge em `main`; deploy por tag.
- Ambientes: `local` (Docker Compose) → `staging` → `production`.
- Qualidade nos gates: Spotless/Checkstyle, testes (Testcontainers), cobertura JaCoCo, SonarQube.

## 10. Diretrizes transversais

- Toda feature nasce com: migração Flyway, testes (domínio + integração), documentação de API
  (OpenAPI via código), evento de auditoria quando sensível, e verificação de tenant.
- Erros: Problem Details (RFC 9457) em toda a API.
- Versionamento de API: `/api/v1/...`; breaking changes exigem nova versão.
- i18n: chaves de mensagem desde o início; pt-BR default.
