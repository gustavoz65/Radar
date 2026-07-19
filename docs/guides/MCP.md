# MCPs do projeto — Context Engineering para agentes

> Status: Ativo · Última revisão: 2026-07-19
> Servidores MCP configurados em [.mcp.json](../../.mcp.json) (escopo de projeto — qualquer agente
> compatível com MCP os herda ao abrir o repo).

## Configurados

| Servidor           | Para quê                                                                                            | Observações                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **context7**       | Documentação atualizada de bibliotecas (Spring Boot, Angular, Flyway…) direto no contexto do agente | Evita API desatualizada da memória do modelo                        |
| **postgres-local** | Consultar o schema/dados do Postgres local (read-only na prática de dev)                            | Aponta para o compose local; NUNCA apontar para produção            |
| **memory-graph**   | Grafo de conhecimento persistente entre sessões (decisões, entidades, relações)                     | Arquivo versionável em `.claude/memory-graph.json` (avaliar commit) |

## Avaliados e adiados (registrar o porquê)

| Servidor                    | Categoria                          | Por que adiado                                                                          |
| --------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| GitHub MCP oficial (remoto) | Git Intelligence / PRs             | O `gh` CLI cobre o fluxo hoje sem OAuth extra; adotar quando review automatizado entrar |
| Sourcegraph/Code-graph MCPs | Code Graph / Architecture Analysis | Spring Modulith já gera documentação viva de módulos (`Documenter`); repo ainda pequeno |
| Playwright MCP              | Testes E2E dirigidos por agente    | Entra na Fase 1 junto com E2E do frontend                                               |
| Filesystem/Git MCP          | Repository Context                 | Redundante em Claude Code (ferramentas nativas)                                         |

## Contexto para agentes (além de MCP)

- [CLAUDE.md](../../CLAUDE.md) — regras inegociáveis, comandos e receitas (carregado automaticamente).
- `docs/` — arquitetura, domínio e ADRs como fonte de verdade navegável.
- Spring Modulith `Documenter` (teste `ModularityTests`) gera diagramas C4/PlantUML dos módulos reais
  em `backend/target/spring-modulith-docs/` — documentação de arquitetura que não mente.
- Revisão desta lista a cada fase do roadmap (ecossistema MCP muda rápido).
