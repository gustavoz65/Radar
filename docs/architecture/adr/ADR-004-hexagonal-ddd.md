# ADR-004 — Hexagonal + DDD pragmático por módulo

- Status: Aceito · Data: 2026-07-19

## Contexto

Precisamos de baixo acoplamento e testabilidade sem burocracia que trave uma equipe pequena.

## Decisão

Dentro de cada módulo: camadas `domain` → `application` → `adapter` (in/web, out/persistence, out/integration),
com a regra de dependência apontando para dentro. Ports como interfaces em `application/port/{in,out}`.

**Compromissos pragmáticos (explícitos e conscientes):**

1. Entidades de domínio **podem** usar anotações JPA (evitamos a dupla-entidade domain/persistence na v1).
   Critério de reversão: quando um agregado precisar de modelo persistente divergente, esse agregado
   ganha entidade de persistência separada — decisão por agregado, não global.
2. Casos de uso são classes `@Service` transacionais (um caso de uso público por classe, sufixo `UseCase`).
3. Records para Value Objects e DTOs; MapStruct para mapeamento adapter↔domínio.
4. Specification Pattern para consultas dinâmicas de listagem; Factory para criação complexa de agregados;
   Strategy para variações por vertical (ex.: precificação).

Verificação: ArchUnit garante a regra de dependência e proíbe `adapter` importar `adapter` de outro módulo.

## Consequências

- (+) Domínio testável sem Spring; troca de adapters barata; caminho claro para CQRS/extração.
- (−) Mais arquivos por feature — aceito em troca de manutenção de longo prazo.
