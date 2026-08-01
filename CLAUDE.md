# CLAUDE.md — Contexto para agentes de IA

Você está no repositório do **Radar** (nome provisório), uma plataforma pessoal de
inteligência financeira. Ela centraliza os dados de Open Finance do usuário (via Pierre,
que já conecta os bancos dele) e cruza isso com indicadores econômicos, notícias e
histórico de mercado para gerar **análises probabilísticas** de apoio à decisão de
investimento — renda fixa, cripto e ações. **O produto nunca recomenda uma compra
específica**; ele mostra um cenário atual do mercado com um score de confiança
explicável.

Este repositório era antes o Omnia (SaaS multi-tenant Java/Spring Modulith + Angular).
Esse produto foi abandonado por completo — se você encontrar vestígios dele
(`backend/`, `frontend/` antigos, docs em `docs/product/` sobre Omnia), é lixo de
transição a ser removido, não contexto a seguir.

## Leia antes de mudar código

1. [docs/superpowers/specs/](docs/superpowers/specs/) — specs de design, uma por
   sub-projeto (veja "Como o projeto está dividido" abaixo). **Fonte de verdade atual.**
   A linguagem visual e o sistema de movimento estão numa spec própria,
   `2026-08-01-radar-design-system-design.md` ("Terrain") — ela substitui a seção
   visual da spec do frontend MVP e é o que vale para qualquer tela nova.
2. Os ADRs e docs de arquitetura antigos (`docs/architecture/`) descrevem o Omnia — não
   se aplicam ao Radar. Novos ADRs para o Radar, se necessários, vão em
   `docs/architecture/adr/` seguindo o mesmo formato.

## Como o projeto está dividido

Quatro sub-projetos independentes, cada um com sua própria spec e plano:

Quatro sub-projetos, **todos construídos**. Não há mais nenhum dado mocado no app:
`lib/data/fixtures/` foi apagado.

1. **Frontend / dashboard** — Next.js. **Construído** (8 abas, plano em
   `docs/superpowers/plans/2026-07-26-radar-frontend-mvp.md`).
2. Integração Open Finance real (Pierre — app da CloudWalk; o nome NÃO é "Pier").
   **Construído e puxando dados reais.** Contas, cartões, transações e "caixinhas" vêm do
   MySQL, alimentados por sync sob demanda. ⚠️ **A doc em `docs.pierre.finance` está
   errada** — `get-accounts` usa `id`/`name`/`type`, `balance` como string, e identifica o
   banco por `connectorName`. Os schemas Zod em `lib/pierre/dto.ts` foram escritos contra
   respostas ao vivo; não "corrija" para o formato documentado.
3. **Ingestão de dados de mercado. Construído.** Selic/CDI/IPCA/poupança do **BCB SGS**
   (séries 432 e 4392 são as anuais; 11 e 12 são as diárias e **não** servem), cripto em
   BRL via **CCXT/Binance**, ações da B3 via **brapi** (plano grátis aceita **1 ticker por
   requisição**), notícias por RSS do InfoMoney e Investing.com. Cripto e ações cotam uma
   **watchlist** (`lib/market/watchlist.ts`), não só o que o usuário tem — as abas servem
   para decidir compra.
4. **Motor de score de confiança. Construído** (piloto só de renda fixa, como a spec
   define). Fórmula determinística versionada em `lib/scoring/fixed-income.ts`; a IA
   (Nemotron via `build.nvidia.com`) só escreve título e resumo.

Toda leitura de dados passa por `lib/data/services.ts` — inclusive status de sync. Nunca
chame a Pierre, uma API externa, o banco ou um repositório direto de um componente.

## Regras inegociáveis

1. **Todo score de confiança precisa de breakdown visível dos fatores + disclaimer.**
   Nunca uma caixa-preta, nunca uma recomendação direta de compra/venda. **O número sai
   sempre da fórmula determinística, nunca de um LLM** — a IA não recebe o score no
   prompt, justamente para não poder repeti-lo nem contradizê-lo, e o disclaimer é fixo
   em código. Se a IA falhar, score e fatores continuam sendo salvos e exibidos.
2. **Quatro conceitos de cor, sem cruzamento.** Direção de preço é
   `--positive`/`--negative`. Confiança é `--signature-gold` — só o gauge e um StatCard
   cujo número **é** um score; fora daí o ouro aparece em um único lugar, o contato da
   marca. Classe de ativo tem tokens próprios
   (`--asset-fixed-income`/`--asset-crypto`/`--asset-equity`), com valores literais: não
   volte a fazer renda fixa ser um alias de `--accent`. Interação (link, foco, aba ativa,
   ação primária) é `--accent`. **Nenhuma cor vive como hex cru fora de
   `app/globals.css`** — inclusive em gráfico. A única exceção é `institution.color`, que
   é dado, não design.
3. **Toda tela é responsiva de verdade** — desktop e mobile são adaptações de primeira
   classe do mesmo layout, revisadas juntas, nunca "desktop primeiro, mobile depois".
4. **Sem chamada de rede direta em componente.** Toda leitura de dados passa por
   `lib/data/services.ts`, que compõe os repositórios. Componente não fala com banco,
   com a Pierre, com a Binance nem com a brapi.
5. **Sem logos oficiais de banco.** Instituições usam badge com iniciais/cor própria —
   evita qualquer dependência de asset de marca.
6. **Dinheiro sempre formatado como BRL.** Datas gravam em UTC: o pool do mysql2 usa
   `timezone: 'Z'`, senão `DATETIME` volta deslocado e uma data pura (vencimento de
   fatura) cai no dia errado.
7. **Valor desconhecido é `—`, nunca `0`.** Zero é uma afirmação: "0% a.a." diz que não
   rende, "R$ 0,00 de rentabilidade" diz que não lucrou. Quando o dado não existe (taxa
   equivalente sem CDI coletado, custo de aquisição que a Pierre não informa), a tela diz
   que não sabe.
8. **Nada de estilizar heading, card, botão ou animação solto.** Título/label usa um
   degrau de `components/common/typography.tsx`
   (`DisplayTitle`/`Eyebrow`/`PanelTitle`/`SubsectionTitle`/`DataLabel`); card usa uma
   receita de `components/common/surface.ts`; ação usa uma de
   `components/common/action.ts`; movimento usa `staggerClass`/`<Reveal>` de
   `components/common/motion.tsx` com duração em `--dur-*` e curva em `--ease-*`. A tag
   (`h2`, `h3`) segue a hierarquia do documento; o peso visual vem do degrau, não da tag.
   Toda rota abre com `SectionHeader` — não existe `<h1>` solto.
9. **Movimento tem um único interruptor de acessibilidade.** O bloco
   `prefers-reduced-motion` no fim de `app/globals.css` cobre tudo que é CSS; não escreva
   guarda própria. O Recharts anima por JS e o CSS não o alcança, então gráfico novo
   consulta `useReducedMotion()` e passa `isAnimationActive`.
10. **Conventional Commits**; commits pequenos. **Nenhuma atribuição de IA no commit.**
    Proibido `Co-Authored-By` de Claude/Anthropic/Copilot/GPT/Gemini/Cursor, proibido
    "Generated with", proibido usar uma identidade de IA como autor ou committer. O commit
    é do dono do repositório; a ferramenta usada para escrevê-lo não assina o trabalho.
11. **Comentário é exceção, não hábito.** Clean code: o nome da função e do tipo carregam o
    quê; comentário só entra quando explica um **porquê** que o código não consegue mostrar
    — uma decisão contra-intuitiva, um bug de terceiro, um trade-off. Uma ou duas linhas.
    Nunca parafraseie o que a linha abaixo já diz, nunca escreva parágrafo em bloco de
    comentário, nunca deixe comentário de "histórico" (isso é trabalho do git log).
    Se precisar de muitas linhas para explicar, o código provavelmente está errado.
12. **Antes de codar contra uma API externa, valide o contrato ao vivo.** A doc da Pierre
    estava errada, a spec apontava as séries erradas do BCB, e a brapi só aceita 1 ticker
    por requisição no plano grátis — os três só apareceram numa chamada real.
13. Sem multi-usuário e sem testes e2e nesta fase.

## Comandos

- `npm run dev` — servidor de desenvolvimento em http://localhost:3000
- `npm run build` — build de produção (escreve em `.next`, é o que CI/Vercel usam)
- `npm run build:check` — build de verificação em `.next-check`. **Use este durante uma
  sessão com o `npm run dev` de pé**: os dois disputam `.next` e um build derruba o CSS
  da aba aberta.
- `npm run lint` — ESLint (next/core-web-vitals + TypeScript)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — testes (Vitest). Rodam contra o banco `radar_test`, nunca o de desenvolvimento.
- `npm run format` — Prettier em todo o repositório
- `docker compose up -d` — sobe o MySQL local
- `npm run db:generate` / `db:migrate` / `db:studio` — Drizzle
- `npm run db:setup:test` — cria e migra o banco de teste (rodar uma vez após clonar)
- `npm run sync` — dispara um sync real da Pierre pela CLI, sem precisar de sessão

## Layout

```
app/
  (dashboard)/              # uma rota por aba; force-dynamic no layout
    visao-geral/ renda-fixa/ cripto/ acoes/ posicoes/ sinais/ noticias/ ferramentas/
  api/                      # sync, positions — o BFF; nenhuma chave sai daqui
components/
  ui/                       # shadcn/ui
  common/                   # o design system: typography, surface, action, motion,
                            # terrain, section-header, stat-card, readout
  shell/                    # header, navegação, marca
  charts/                   # Recharts + chart-theme.ts (tooltip/eixo/grid comuns)
  <feature>/                # componentes de cada aba
lib/
  data/services.ts          # ÚNICA porta de leitura da UI
  hooks/                    # use-reduced-motion (ponte CSS→JS p/ o Recharts)
  db/                       # schema + pool Drizzle
  repositories/             # acesso a tabela, um módulo por assunto
  pierre/                   # cliente Open Finance (DTO Zod + mappers)
  market/                   # bcb, crypto (ccxt), equities (brapi), news (rss), watchlist
  scoring/                  # fórmula determinística + orquestração
  ai/                       # nemotron: só escreve texto, nunca o score
  cache/                    # Upstash, opcional e tolerante a falha
  types/                    # Account, Position, Signal, MarketQuote...
scripts/                    # sync CLI, setup do banco de teste
```

## Como adicionar um módulo novo (receita)

1. Valide o contrato da fonte externa com uma chamada real antes de escrever schema.
2. Contrato em `lib/types/` → parser puro em `lib/<fonte>/` com Zod na borda →
   repositório em `lib/repositories/` → função em `lib/data/services.ts`.
3. Rota em `app/(dashboard)/<aba>/` com `loading.tsx` real (Suspense), abrindo com
   `SectionHeader` e com os grids marcados com `staggerClass`.
4. Teste o parser offline (fixture de resposta real no teste, nunca chamada de rede) e a
   persistência contra `radar_test`.
5. Se a aba expõe um `Signal`, o breakdown de fatores + disclaimer é obrigatório.
