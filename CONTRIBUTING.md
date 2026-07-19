# Contribuindo — Omnia

## Fluxo Git (GitHub Flow simplificado)

1. `main` é sempre deployável e **protegida** (sem push direto; PR obrigatório com review + CI verde).
2. Branch por trabalho: `feat/<módulo>-<resumo>`, `fix/<módulo>-<resumo>`, `chore/…`, `docs/…`, `refactor/…`.
   Ex.: `feat/scheduling-online-booking`.
3. Commits pequenos, atômicos e semânticos (abaixo). Rebase sobre `main` antes do PR; squash-merge
   com mensagem convencional no merge.
4. Release: tag SemVer `vMAJOR.MINOR.PATCH` a partir da `main`.

## Conventional Commits (obrigatório — validado por commitlint)

```
<type>(<scope>): <descrição no imperativo, minúscula, sem ponto final>

[corpo: o porquê, não o como]
[rodapé: BREAKING CHANGE:, Refs #123]
```

- **type**: `feat` `fix` `refactor` `perf` `test` `docs` `build` `ci` `chore` `revert`
- **scope**: módulo (`tenant`, `identity`, `customer`, `scheduling`, `finance`, ...) ou área
  (`backend`, `frontend`, `docs`, `infra`, `deps`).
- Exemplos: `feat(scheduling): add drag-and-drop rescheduling` · `fix(identity): rotate refresh token family on reuse`

## Pull Requests

- Template obrigatório (o quê/por quê/como testar/screenshots quando UI).
- Checklist: testes incluídos · migração Flyway se schema mudou · OpenAPI atualizado · docs/ADR se
  decisão nova · verificação de tenant em toda query nova.
- **Code review obrigatório** (mínimo 1 aprovação). Revisor olha: fronteiras de módulo, isolamento
  de tenant, testes, nomes do domínio.
- CI verde é pré-condição de merge.

## Setup do ambiente

```bash
git clone <repo> && cd Projet
npm install            # hooks (husky, commitlint, prettier)
make up                # Postgres + Redis + MailHog (Docker)
make backend-run       # API em :8080
make frontend-run      # app em :4200
make test              # suíte completa
```

Requisitos: JDK 25+ (alvo de compilação é 25), Node 20+, Docker, Maven 3.9+.
Alternativa sem instalar nada: **Dev Container** (`.devcontainer/`) no VS Code.

## Qualidade local

- Hooks automáticos: commit-msg (commitlint), pre-commit (prettier em staged), pre-push (spotless+testes rápidos).
- `make format` corrige formatação; `make check` roda os gates localmente.

## Documentação

- Decisão arquitetural nova ⇒ ADR (docs/architecture/adr/README.md).
- Módulo novo ⇒ atualizar ARCHITECTURE.md §3, DOMAIN.md e MODULES.md.
- Regra de ouro: se um agente de IA ou dev novo não conseguir descobrir sozinho, documente.
