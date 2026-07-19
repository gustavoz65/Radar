# Architecture Decision Records

Formato: [MADR](https://adr.github.io/madr/) simplificado. Um ADR por decisão relevante.
Status possíveis: Proposto · Aceito · Substituído por ADR-xxx · Rejeitado.

| #                                    | Título                                                         | Status |
| ------------------------------------ | -------------------------------------------------------------- | ------ |
| [001](./ADR-001-stack.md)            | Stack: Java 25 + Spring Boot / Angular / PostgreSQL / Redis    | Aceito |
| [002](./ADR-002-modular-monolith.md) | Monólito modular (Spring Modulith) antes de microservices      | Aceito |
| [003](./ADR-003-multi-tenancy.md)    | Multi-tenancy pool (shared schema) com RLS                     | Aceito |
| [004](./ADR-004-hexagonal-ddd.md)    | Hexagonal + DDD pragmático por módulo                          | Aceito |
| [005](./ADR-005-flyway-uuidv7.md)    | Flyway para schema; UUIDv7 como chave                          | Aceito |
| [006](./ADR-006-events-cqrs.md)      | Eventos de domínio via Modulith; CQRS leve; sem event sourcing | Aceito |
| [007](./ADR-007-frontend.md)         | Angular standalone + signals + Material + Tailwind             | Aceito |
| [008](./ADR-008-auth.md)             | JWT + refresh rotativo; usuário por tenant; RBAC               | Aceito |
| [009](./ADR-009-ai-gateway.md)       | Gateway de IA próprio com provedor plugável                    | Aceito |
| [010](./ADR-010-quality-gates.md)    | Qualidade: Spotless+Checkstyle+Sonar+JaCoCo+Testcontainers     | Aceito |

Como criar um novo ADR: copie um existente, próximo número, PR com label `adr`.
