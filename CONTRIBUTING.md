# Contribuindo — Radar

Projeto pessoal — este guia existe principalmente para manter agentes de IA e o
próprio autor consistentes entre sessões.

## Fluxo Git

1. `main` é a branch de trabalho principal.
2. Commits pequenos, atômicos e semânticos (Conventional Commits, abaixo).

## Conventional Commits (validado por commitlint)

```
<type>(<scope>): <descrição no imperativo, minúscula, sem ponto final>

[corpo: o porquê, não o como]
```

- **type**: `feat` `fix` `refactor` `perf` `test` `docs` `build` `ci` `chore` `revert`
- **scope**: livre por enquanto (ex.: `frontend`, `pierre`, `market-data`, `ai`,
  `docs`, `deps`) — ainda não há módulos fixos, o escopo do commitlint não restringe
  valores até a estrutura do código se estabilizar.

## Setup do ambiente

```bash
npm install   # hooks (husky, commitlint, prettier)
```

Requisitos adicionais serão adicionados aqui conforme o sub-projeto 1 (frontend
Next.js) for implementado.

## Documentação

- Toda decisão de design nova ⇒ spec em `docs/superpowers/specs/`.
- Regra de ouro: se um agente de IA ou dev novo não conseguir descobrir sozinho,
  documente.
