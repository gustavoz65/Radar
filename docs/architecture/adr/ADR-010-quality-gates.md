# ADR-010 — Qualidade: Spotless + Checkstyle + Sonar + JaCoCo + Testcontainers

- Status: Aceito · Data: 2026-07-19

## Decisão

Gates automáticos, na ordem em que pegam o problema:

1. **Local**: Husky + lint-staged (Prettier em md/json/yaml/frontend), Commitlint (Conventional Commits),
   `spotless:check` no pre-push do backend.
2. **Build**: Spotless (palantir-java-format) + Checkstyle (regras estruturais que formatação não cobre:
   imports, complexidade, tamanho de método) falham o build Maven.
3. **Testes**: pirâmide — domínio puro (JUnit), casos de uso (Mockito), adapters e RLS (Testcontainers
   com PostgreSQL real), fronteiras (Modulith verify + ArchUnit), API (MockMvc/RestAssured).
   Cobertura JaCoCo mínima: **80% em `domain` e `application`** (adapters medidos, sem gate na v1).
4. **CI**: GitHub Actions roda tudo em PR; SonarQube (estrutura pronta em `docker-compose` +
   `sonar-project.properties`; server ativável) com quality gate: zero issues críticos/bloqueadores.
5. **Testes de isolamento multi-tenant** obrigatórios: suíte que tenta acesso cross-tenant e deve falhar.

## Justificativa

Formatação automatizada elimina debate; Checkstyle cobre o que formatador não vê; Testcontainers dá
fé real em RLS/SQL (H2 mentiria); gate de cobertura no domínio (onde mora o risco) e não em getters.

## Consequências

- (+) Regressões caras viram falhas de build baratas. (−) CI mais lento (~min) — aceito; paralelizado.
