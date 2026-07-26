# Radar

> Plataforma pessoal de inteligência financeira — centraliza dados de Open Finance
> (via Pier) e cruza com indicadores econômicos, notícias e histórico de mercado para
> gerar análises probabilísticas de apoio a decisões de investimento em renda fixa,
> cripto e ações. Nunca recomenda uma compra específica; mostra um cenário atual do
> mercado com um score de confiança explicável.

## Por onde começar

| Quero…                           | Documento                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Entender o produto e as decisões | [docs/superpowers/specs/](docs/superpowers/specs/) — uma spec por sub-projeto |
| Contribuir                       | [CONTRIBUTING.md](CONTRIBUTING.md)                                            |
| Contexto para agentes de IA      | [CLAUDE.md](CLAUDE.md)                                                        |

## Sub-projetos

O Radar é dividido em quatro sub-projetos independentes:

1. [Frontend (Next.js, dados mocados)](docs/superpowers/specs/2026-07-26-radar-frontend-mvp-design.md)
   — **construído.** Dashboard completo com sete abas; toda leitura de dados passa
   por `lib/data/services.ts`, que hoje serve apenas dados mocados de
   `lib/data/fixtures/`. Não há integração real ainda.
2. [Integração Open Finance via Pier](docs/superpowers/specs/2026-07-26-radar-pierre-integration-design.md)
   — ainda não iniciado.
3. [Ingestão de dados de mercado](docs/superpowers/specs/2026-07-26-radar-market-data-design.md)
   — ainda não iniciado.
4. [Motor de análise / score de confiança](docs/superpowers/specs/2026-07-26-radar-ai-scoring-engine-design.md)
   — ainda não iniciado.

## Rodando localmente

```bash
npm install
npm run dev   # http://localhost:3000
```

## Comandos

- `npm run dev` — servidor de desenvolvimento em http://localhost:3000
- `npm run build` — build de produção
- `npm run lint` — ESLint (next/core-web-vitals + TypeScript)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — testes unitários (Vitest)
- `npm run format` — Prettier em todo o repositório

## Licença

Proprietário. Todos os direitos reservados.
