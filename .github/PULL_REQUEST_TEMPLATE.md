## O quê

<!-- O que este PR faz, em 1-3 frases -->

## Por quê

<!-- Contexto/motivação. Link para issue/requisito (docs/product/MODULES.md) -->

## Como testar

<!-- Passos objetivos. Screenshots/GIF se houver UI -->

## Checklist

- [ ] Testes incluídos (domínio e/ou integração)
- [ ] Toda query/tabela nova respeita tenant (RLS + índice `(tenant_id, …)`)
- [ ] Migração Flyway incluída (se schema mudou) e compatível com versão anterior
- [ ] OpenAPI atualizado (se API mudou)
- [ ] Documentação/ADR atualizados (se decisão nova)
- [ ] Commits seguem Conventional Commits
