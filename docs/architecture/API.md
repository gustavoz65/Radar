# Documentação de API — Omnia

> Status: Ativo · Última revisão: 2026-07-19
> A fonte de verdade do contrato é o **OpenAPI gerado do código** (springdoc):
> `http://localhost:8080/swagger-ui.html` · `http://localhost:8080/v3/api-docs`.
> Este documento define as convenções que todo endpoint segue.

## Convenções

- Base path: `/api/v1`. Breaking change ⇒ `/api/v2` (convivência mínima de 6 meses).
- Recursos em kebab-case plural: `/api/v1/customers`, `/api/v1/service-offerings`.
- JSON camelCase; datas ISO-8601 UTC (`2026-07-19T14:30:00Z`); dinheiro `{ "amount": "150.00", "currency": "BRL" }`.
- IDs: UUID string. Idempotência em POSTs críticos via header `Idempotency-Key`.
- Paginação: `?page=0&size=20&sort=createdAt,desc` → envelope `{ content, page: { number, size, totalElements, totalPages } }`.
- Filtros de listagem: query params simples + `q` para busca textual; filtros complexos via visões salvas.
- Erros: **RFC 9457 Problem Details** com `type`, `title`, `status`, `detail`, `instance`, e extensões
  `code` (catálogo interno estável, ex.: `appointment.overlap`) e `errors[]` para validação de campos.
- Autenticação: `Authorization: Bearer <jwt>`. Refresh: `POST /api/v1/auth/refresh` (cookie httpOnly).
- Tenant: derivado do JWT; **nunca** aceito de header/query em endpoints autenticados.
- API pública de integrações (Fase 3): `/api/public/v1` com API keys + escopos; webhooks assinados (HMAC).
- Rate limits: 429 com `Retry-After`; limites por plano documentados no OpenAPI.

## Endpoints núcleo (Fase 0)

| Método  | Rota                      | Descrição                                        |
| ------- | ------------------------- | ------------------------------------------------ |
| POST    | `/api/v1/tenants/signup`  | Cria tenant + usuário proprietário (público)     |
| POST    | `/api/v1/auth/login`      | Login → access token + cookie refresh            |
| POST    | `/api/v1/auth/refresh`    | Rotação de refresh token                         |
| POST    | `/api/v1/auth/logout`     | Revoga a família de refresh tokens               |
| GET     | `/api/v1/me`              | Perfil, papéis, permissões e módulos habilitados |
| GET/PUT | `/api/v1/tenant/settings` | Configurações e branding do tenant               |

Módulos seguintes documentam seus recursos no OpenAPI por anotações nos controllers (obrigatório:
`summary`, `description`, códigos de erro possíveis com seus `code`s).
