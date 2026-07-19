# ADR-001 — Stack: Java 25 LTS + Spring Boot / Angular / PostgreSQL / Redis

- Status: Aceito · Data: 2026-07-19

## Contexto

Plataforma SaaS comercial multi-tenant com vida útil de anos, equipe pequena no início, necessidade
de contratação fácil e ecossistema maduro para segurança, dados e integrações.

## Decisão

- **Backend**: Java 25 LTS, Spring Boot 3.5.x (Web, Security, Data JPA/Hibernate, Validation,
  Actuator, Cache), Redis, JWT/OAuth2, springdoc-openapi, PostgreSQL, Flyway, MapStruct,
  Lombok (restrito — ver CodingStyle), Maven, Docker.
- **Testes**: JUnit 5, Mockito, Testcontainers, ArchUnit, Spring Modulith Test.
- **Frontend**: Angular estável mais recente, Angular Material, TailwindCSS, RxJS + Signals.

## Justificativa

- Java LTS + Spring: maturidade em segurança/transações/observabilidade, pool de contratação,
  suporte de longo prazo — alinhado a "produto para durar anos".
- JDK do ambiente é 25; **compilamos com `--release 25`** para garantir alvo LTS.
- PostgreSQL: RLS nativo (pilar do multi-tenancy), JSONB (personalização), particionamento (escala).
- Redis: cache, rate limit e locks sem introduzir broker pesado prematuramente.
- Maven em vez de Gradle: convenção sobre configuração, builds reprodutíveis, menor variância em CI.

## Consequências

- (+) Ecossistema estável, upgrades previsíveis (Boot 3.x → 4.x planejável).
- (−) Verbosidade Java mitigada com records, MapStruct e Lombok pontual.
- Revisão do stack a cada fase do roadmap.
