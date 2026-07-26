# Radar

> Plataforma pessoal de inteligência financeira — centraliza dados de Open Finance
> (via Pierre) e cruza com indicadores econômicos, notícias e histórico de mercado
> para gerar análises probabilísticas de apoio a decisões de investimento. Nunca
> recomenda uma compra específica.

**Status:** especificação concluída, implementação ainda não iniciada. Este
repositório era antes o Omnia (SaaS multi-tenant); o código antigo foi removido —
histórico recuperável via `git log` se necessário.

## Por onde começar

| Quero…                           | Documento                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Entender o produto e as decisões | [docs/superpowers/specs/](docs/superpowers/specs/) — uma spec por sub-projeto |
| Contribuir                       | [CONTRIBUTING.md](CONTRIBUTING.md)                                            |
| Contexto para agentes de IA      | [CLAUDE.md](CLAUDE.md)                                                        |

## Sub-projetos

1. [Frontend (Next.js, dados mocados)](docs/superpowers/specs/2026-07-26-radar-frontend-mvp-design.md)
2. [Integração Open Finance via Pierre](docs/superpowers/specs/2026-07-26-radar-pierre-integration-design.md)
3. [Ingestão de dados de mercado](docs/superpowers/specs/2026-07-26-radar-market-data-design.md)
4. [Motor de análise / score de confiança](docs/superpowers/specs/2026-07-26-radar-ai-scoring-engine-design.md)

## Rodando localmente

Ainda não há código de aplicação neste repositório — a implementação do sub-projeto 1
(frontend) é o próximo passo. Os hooks de git (formatação/commit lint) já funcionam:

```bash
npm install   # instala hooks (husky/commitlint/prettier)
npm run format
```

## Licença

Proprietário. Todos os direitos reservados.
