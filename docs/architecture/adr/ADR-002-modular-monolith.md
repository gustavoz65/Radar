# ADR-002 — Monólito modular (Spring Modulith) antes de microservices

- Status: Aceito · Data: 2026-07-19

## Contexto

Multi-tenant SaaS com ~18 módulos de negócio planejados. Microservices desde o início multiplicariam
custo operacional (deploys, observabilidade, consistência) sem tráfego que o justifique.

## Decisão

Um único deployable Spring Boot organizado como **monólito modular com Spring Modulith**:

- Cada módulo = pacote de topo (`com.omnia.platform.<módulo>`) anotado via `package-info.java`.
- Fronteiras verificadas em teste (`ApplicationModules.verify()`): dependências ilegais quebram o build.
- Comunicação entre módulos: API pública do módulo ou eventos (`ApplicationModuleListener` + event
  publication registry, que persiste eventos e entrega após commit — outbox embutido).

Consideramos e rejeitamos:

- **Multi-módulo Maven**: fronteira boa, mas atrito alto (POMs, releases, IDE) sem ganho sobre Modulith na fase atual.
- **Microservices**: custo operacional injustificado pré-tração.

## Critérios de extração futura (quando um módulo vira serviço)

1. Pressão de escala assimétrica comprovada (ex.: notification, ai), ou
2. Necessidade de tecnologia divergente, ou
3. Equipe dedicada com ciclo de release próprio.
   A extração é viável porque: sem FKs entre módulos, comunicação por eventos, dados por módulo documentados.

## Consequências

- (+) Velocidade de desenvolvimento, transações locais, refactoring barato, um pipeline.
- (−) Disciplina exigida nas fronteiras — automatizada por testes Modulith/ArchUnit no CI.
