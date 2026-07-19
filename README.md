# Omnia Platform

> Plataforma SaaS multi-tenant e modular de gestão para negócios de serviços — clínicas, barbearias,
> salões, academias, petshops, oficinas e mais — com módulos configuráveis, personalização por
> empresa e IA nativa.

**Status: Fase 0 — Fundação.** Ver [Roadmap](docs/product/ROADMAP.md).

## Por onde começar

| Quero…                      | Documento                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entender o produto          | [Visão](docs/product/VISION.md) · [Mercado](docs/product/MARKET-RESEARCH.md) · [Módulos](docs/product/MODULES.md) · [IA](docs/product/AI-FEATURES.md)                                                          |
| Entender a técnica          | [Arquitetura](docs/architecture/ARCHITECTURE.md) · [Domínio](docs/architecture/DOMAIN.md) · [Banco](docs/architecture/DATABASE.md) · [ADRs](docs/architecture/adr/README.md) · [API](docs/architecture/API.md) |
| Contribuir                  | [CONTRIBUTING.md](CONTRIBUTING.md) · [Estilo de código](docs/guides/CODING-STYLE.md)                                                                                                                           |
| Operar                      | [Deploy](docs/guides/DEPLOYMENT.md)                                                                                                                                                                            |
| Contexto para agentes de IA | [CLAUDE.md](CLAUDE.md)                                                                                                                                                                                         |

## Stack

**Backend**: Java 21 · Spring Boot 3.5 (Modulith) · PostgreSQL 16 (RLS multi-tenant) · Redis · Flyway ·
JWT/OAuth2 · MapStruct · Testcontainers — [ADR-001](docs/architecture/adr/ADR-001-stack.md)

**Frontend**: Angular (standalone + signals) · Angular Material · TailwindCSS — [ADR-007](docs/architecture/adr/ADR-007-frontend.md)

**Arquitetura**: monólito modular hexagonal com DDD, eventos de domínio e multi-tenancy pool com
Row-Level Security — [ADR-002](docs/architecture/adr/ADR-002-modular-monolith.md) · [ADR-003](docs/architecture/adr/ADR-003-multi-tenancy.md) · [ADR-004](docs/architecture/adr/ADR-004-hexagonal-ddd.md)

## Rodando localmente

```bash
npm install          # instala hooks de git (husky/commitlint/prettier)
make up              # infra: Postgres + Redis + MailHog
make backend-run     # API: http://localhost:8080  (Swagger: /swagger-ui.html)
make frontend-run    # App: http://localhost:4200
make test            # suíte completa
make check           # todos os gates de qualidade locais
```

Sem `make` no Windows? Use `.\scripts\dev.ps1 <alvo>` (mesmos alvos) ou o Dev Container.

## Estrutura do repositório

```
backend/    Monólito modular Spring Boot (módulos: shared, tenant, identity, customer, …)
frontend/   Workspace Angular
docs/       Produto, arquitetura, ADRs e guias
scripts/    Automação de desenvolvimento
.github/    CI/CD e templates de PR
```

## Licença

Proprietário. Todos os direitos reservados.
