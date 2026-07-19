# CLAUDE.md — Contexto para agentes de IA

Você está no repositório do **Omnia**, uma plataforma SaaS comercial multi-tenant de gestão para
negócios de serviços (clínicas, barbearias, academias, petshops, oficinas…). Não é projeto de
estudos nem MVP: qualidade de produção, pensado para anos de evolução.

## Leia antes de mudar código

1. [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) — mapa da arquitetura
2. [docs/architecture/DOMAIN.md](docs/architecture/DOMAIN.md) — linguagem ubíqua e agregados (nomes são lei)
3. [docs/architecture/adr/](docs/architecture/adr/README.md) — decisões formais; não as contrarie sem novo ADR
4. [docs/guides/CODING-STYLE.md](docs/guides/CODING-STYLE.md) — estilo além do formatador
5. [docs/product/MODULES.md](docs/product/MODULES.md) — requisitos por módulo

## Regras inegociáveis

1. **Tenant é fronteira absoluta.** Toda tabela de negócio tem `tenant_id` + RLS + índice
   `(tenant_id, …)`. Toda query nova respeita o TenantContext. Teste de isolamento para toda feature.
2. **Fronteiras de módulo**: módulos só se falam por API pública do módulo ou eventos de domínio.
   Nunca importe `adapter`/repositório de outro módulo. `ApplicationModules.verify()` no CI quebra se violar.
3. **Camadas**: `adapter → application → domain`. Regra de negócio no domínio; controller fino;
   `@Transactional` só em application.
4. **Schema só via Flyway** (nunca `ddl-auto=update`; nunca editar migração aplicada).
5. **Termos canônicos em inglês** do DOMAIN.md no código/banco (`Customer`, não `Cliente`/`Patient`);
   terminologia vertical é só camada de UI.
6. **Dinheiro = `Money` VO / NUMERIC**; tempo = `Instant` UTC; IDs = UUIDv7.
7. **Conventional Commits** com escopo de módulo; commits pequenos; PR com testes.
8. **Erros de API**: Problem Details RFC 9457 com `code` estável.
9. Lombok restrito (ver CodingStyle); records para VO/DTO/eventos.
10. Toda feature: migração + testes (domínio e integração) + OpenAPI + auditoria se sensível.

## Comandos

```bash
make up | down        # infra docker (Postgres 5432, Redis 6379, MailHog 8025)
make backend-run      # API :8080 (profile local)
make backend-test     # testes backend (Testcontainers → precisa de Docker)
make frontend-run     # Angular :4200
make format | check   # corrigir formatação / rodar todos os gates
```

No Windows sem make: `.\scripts\dev.ps1 <alvo>`.

## Layout do backend (Spring Modulith)

```
backend/src/main/java/com/omnia/platform/
├── OmniaApplication.java
├── shared/        # kernel: TenantContext, DomainException, Money, eventos base — sem regra de negócio
├── tenant/        # tenants, settings, módulos habilitados, personalização
├── identity/      # usuários, auth JWT, papéis/permissões
└── <novo módulo>/ # sempre: domain/ application/ adapter/ + package-info.java
```

Migrações: `backend/src/main/resources/db/migration/V<seq>__<intent>.sql` — toda tabela nova segue a
receita RLS de [DATABASE.md](docs/architecture/DATABASE.md) §3.

## Como adicionar um módulo novo (receita)

1. Requisitos em MODULES.md → agregados em DOMAIN.md → ADR se houver decisão nova.
2. Pacote `com.omnia.platform.<módulo>` com `package-info.java` (@ApplicationModule).
3. Domínio puro + testes → casos de uso + ports → adapters (web/persistence) → migração Flyway com RLS.
4. Eventos de domínio para integração com outros módulos (nunca FK cruzando módulos — use source_type/source_id).
5. Controller com OpenAPI anotado; permissões `module:action` novas seedadas.
