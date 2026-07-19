# ADR-005 — Flyway para todo schema; UUIDv7 como chave primária

- Status: Aceito · Data: 2026-07-19

## Decisão

1. **Flyway** é o único mecanismo de mudança de schema (`ddl-auto=validate` sempre; nunca `update`).
   Convenções em DATABASE.md §4. Migrações rodam com role `omnia_owner`.
2. **UUIDv7** (time-ordered) gerado na aplicação como PK de todas as entidades.

## Justificativa

- Flyway: histórico auditável, reprodutível em qualquer ambiente, compatível com expand/contract.
- UUIDv7 vs sequencial: não vaza cardinalidade entre tenants, permite geração client-side/offline,
  merge de dados sem colisão; vs UUIDv4: ordenação temporal preserva localidade de índice B-tree
  (problema clássico de v4 aleatório). Suporte nativo no Java via biblioteca (`java-uuid-generator`).

## Consequências

- (+) IDs seguros e performáticos; (−) 16 bytes por chave (aceitável), legibilidade menor em debug
  (mitigada por `created_at` e slugs onde humano precisa ler).
