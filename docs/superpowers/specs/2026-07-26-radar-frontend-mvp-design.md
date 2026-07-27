# Radar — Frontend MVP (Investment Intelligence Dashboard)

**Data:** 2026-07-26
**Status:** Aprovado para plano de implementação

## Contexto

O repositório abandona por completo o produto anterior (Omnia, SaaS multi-tenant de
gestão para negócios de serviços, stack Java/Spring Modulith + Angular). O novo produto
é uma plataforma pessoal de inteligência financeira: centraliza dados de Open Finance
(via Pierre, que já conecta os bancos do usuário) e cruza com indicadores econômicos,
notícias e histórico de mercado para gerar análises probabilísticas de apoio à decisão
de investimento — nunca uma recomendação direta de compra/venda.

O projeto completo se divide em quatro sub-projetos independentes, cada um com sua
própria spec e plano:

1. **Frontend / dashboard** — objeto desta spec.
2. Integração Open Finance real (Pierre).
3. Ingestão de dados de mercado (cripto, ações, CDI/Selic, notícias).
4. Motor de análise probabilística (IA / score de confiança).

Esta spec cobre **apenas o item 1**: um front-end completo, navegável, com todas as
telas e visual final, operando inteiramente sobre dados mocados que espelham o formato
que os itens 2–4 vão produzir depois. Nenhuma integração real é construída aqui.

O código do Omnia (`backend/`, `frontend/` atuais) é **deletado** do repositório como
parte da implementação desta spec (recuperável via histórico do git se necessário).
Documentos específicos do domínio Omnia em `docs/product/` (VISION.md, MODULES.md,
AI-FEATURES.md, MARKET-RESEARCH.md, ROADMAP.md) também são removidos/substituídos.

## Fora de escopo (specs futuras)

- Conexão real com a API da Pierre / Open Finance.
- Ingestão real de preços de cripto/ações, Selic/CDI, notícias.
- Motor de IA que calcula os scores de confiança de verdade.
- Autenticação, multi-usuário, qualquer preocupação de segurança de dados reais.
- Testes end-to-end (não há backend para testar contra).

## Stack técnica

- **Next.js 15 (App Router)** + TypeScript + Tailwind CSS + shadcn/ui.
- Fontes: **Geist Sans** (UI/texto) e **Geist Mono** (números, dados tabulares).
- Gráficos: **Recharts** (mesma base dos componentes de chart do shadcn/ui).
- Sem gerenciador de estado global: Server Components para a maior parte das telas;
  estado local (`useState`) apenas para interações client-side (tabs, expandir
  breakdown de score, filtros).
- Sem autenticação nesta fase — o app abre direto no dashboard.
- App vive na raiz do repositório (`package.json`, `app/`, etc. no topo do repo).

## Camada de dados mocados

Um "service layer" de funções assíncronas com a mesma assinatura que a futura API real
vai ter, retornando fixtures locais com latência simulada (ex: 300–800ms). Os componentes
já usam `async/await` + `loading.tsx`/Suspense reais. Quando o backend real existir
(specs 2–4), só o _interior_ dessas funções muda — nenhum componente é tocado.

```
lib/
  data/
    fixtures/          # JSON/TS com os dados mocados (contas, posições, sinais, notícias...)
    services.ts         # getPortfolioSummary(), getSignals(), getNews(), etc.
  types/                 # contratos TS compartilhados (Account, Position, Signal, NewsItem...)
```

### Contratos principais (formato)

Espelham o padrão Open Finance do Bacen (`/accounts`, `/balances`, `/transactions`),
já que qualquer agregador (Pierre incluso) converge para esse formato — isso torna a
troca por dados reais mais direta:

- `Account { id, institution, type, balance, lastUpdated }`
- `Position { id, assetClass: 'rendaFixa'|'cripto'|'acoes', name, quantity, currentValue, history: TimeSeriesPoint[] }`
- `Signal { id, title, assetClass, score: number (0-100), factors: { label, direction: 'positive'|'negative'|'neutral' }[], summary, disclaimer }`
- `NewsItem { id, title, source, publishedAt, category, summary }`

### Instituições mocadas (via Pierre)

Banco do Brasil, Nubank, Sicredi, Mercado Pago. Representadas por badge com iniciais/cor
própria (sem uso de logos oficiais — evita qualquer dependência de assets de marca).

A identidade delas (nome, iniciais, cor de marca) vive em **um único lugar**,
`lib/shared/institutions.ts`, chaveada pelo `providerCode` da Pierre. Tanto os fixtures
(`lib/data/fixtures/institutions.ts`) quanto o mapper da integração
(`lib/pierre/institutions.ts`) leem de lá — nenhum dos dois redeclara os hex, para que um
ajuste de cor não divirja em silêncio entre o mock e o real.

### Realismo dos números

Séries históricas simuladas (12 meses de evolução de patrimônio, preços diários de
cripto/ações) para que os gráficos fiquem representativos do produto final. Os
indicadores de renda fixa usam como âncora os valores reais de julho/2026 pesquisados
para esta spec — **Selic 14,25% a.a., CDI ≈ 14,15% a.a.** — para que os mocks de CDB
(ex: "110% do CDI"), Tesouro Selic etc. sejam plausíveis.

## Sistema de design

Direção validada com o usuário via mockups: **"Terminal Escuro"** (estilo
Bloomberg/TradingView — denso, numérico) com paleta refinada e um elemento de
assinatura próprio.

**Cores (tokens):**

| Token              | Hex       | Uso                                                    |
| ------------------ | --------- | ------------------------------------------------------ |
| `--bg`             | `#0a0e14` | fundo geral                                            |
| `--surface`        | `#0d1117` | cards, painéis                                         |
| `--border`         | `#21262d` | bordas, divisores                                      |
| `--text`           | `#e6edf3` | texto primário                                         |
| `--text-muted`     | `#8b949e` | texto secundário/labels                                |
| `--positive`       | `#3fb950` | alta / variação positiva                               |
| `--negative`       | `#f85149` | baixa / variação negativa                              |
| `--accent`         | `#58a6ff` | links, elementos interativos                           |
| `--signature-gold` | `#f5b942` | **reservado exclusivamente** para o score de confiança |

O dourado (`--signature-gold`) nunca é reaproveitado para alta/baixa de preço — mantém
"isso é confiável" visualmente distinto de "isso subiu/desceu", evitando que o usuário
confunda os dois sinais.

**Cores de classe de ativo** (gráfico de alocação — fatia e legenda):

| Token                  | Hex             | Uso          |
| ---------------------- | --------------- | ------------ |
| `--asset-fixed-income` | `var(--accent)` | renda fixa   |
| `--asset-crypto`       | `#a371f7`       | cripto       |
| `--asset-equity`       | `#2dd4bf`       | ações e FIIs |

Elas nomeiam **o que é o ativo**, nunca uma direção. Ações usa um teal, e não um verde,
justamente porque um verde de legenda ao lado do verde de `--positive` seria lido como
"o preço subiu" em vez de "essa é a classe". Nenhuma cor de gráfico vive como hex cru
dentro de componente — se um gráfico novo precisa de cor, ela nasce como token em
`app/globals.css`.

**Elevação (dois níveis, e `--bg` faz dois papéis):**

- `--bg` — fundo da página **e** poço recessado _dentro_ de um card: input do simulador,
  disclaimer do sinal, item ativo do menu mobile.
- `--surface` — card/painel elevado sobre a página.

Ver um `bg-bg` dentro de um `bg-surface` é intencional, não bug: é o degrau para baixo.

**Card de superfície:** um único recipe, em `components/common/surface.ts`
(`surfaceClass` = `rounded-lg border border-border bg-surface`; `surfaceCardClass`
acrescenta `p-4 sm:p-5`). Todo card usa ele — o padding responsivo é o padrão, não
`p-4`/`p-5`/`p-6` fixos escolhidos caso a caso.

### Escala tipográfica

Quatro degraus, definidos em `components/common/typography.tsx`. O nível do heading
(`h1`/`h2`/`h3`) segue a hierarquia real do documento; o **peso visual** vem do degrau,
não da tag — foi justamente o que se perdeu quando cada `<h2>` era estilizado à mão.

| Degrau            | Estilo                                                          | Onde                                                             |
| ----------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `SectionHeader`   | `text-xl sm:text-2xl font-semibold text-text`                   | título da rota (`h1`), um por página                             |
| `PanelTitle`      | `text-base font-medium` / `text-lg font-semibold` (`size="lg"`) | título do conteúdo dentro de um card: notícia, ferramenta, sinal |
| `SubsectionTitle` | `text-sm font-semibold uppercase tracking-wider text-text`      | nomeia uma região da página: um gráfico, uma lista               |
| `DataLabel`       | `text-xs font-normal uppercase tracking-wider text-muted`       | nomeia **um valor**: StatCard, cabeçalho de tabela, fator        |

Os dois últimos compartilham o tratamento uppercase/tracking do "Terminal Escuro"; o que
os separa é tamanho, peso e cor. `DataLabel` nunca vira heading.

### Largura de coluna em grid: `fr` vs `px`

Ambos aparecem e a escolha é semântica, não estética:

- `fr` (ex: `lg:grid-cols-[2fr_1fr]` na visão geral) quando as duas colunas são conteúdo
  e devem crescer juntas com a tela.
- `px` (ex: `lg:grid-cols-[320px_1fr]` no detalhe do sinal) quando a coluna é um painel
  de identificação de tamanho previsível, que não ganha nada em esticar.

**Elemento de assinatura:** um **gauge em arco** (mostrador tipo painel de instrumento)
para representar todo score de confiança — no card resumido (mini) e na tela de
detalhe do sinal (grande). É o motivo visual recorrente do produto, reforçando a
metáfora de "terminal/painel de instrumentos financeiros".

**Explicabilidade:** todo `Signal` exibido sempre vem acompanhado do breakdown de
fatores que compõem o score (ex: "Selic em alta há 3 reuniões (+)", "liquidez diária
reduz flexibilidade (−)") e de um disclaimer fixo ("Não é recomendação de compra.
Reflete o cenário atual do mercado."). Nunca existe um score sem justificativa visível.

## Navegação e responsividade

- **Desktop:** navegação horizontal no topo com as 7 abas.
- **Mobile:** navegação colapsa em ícone de menu (hambúrguer) que abre a lista por
  cima; conteúdo ganha a largura total da tela.
- Toda tela precisa funcionar bem nos dois tamanhos — não é "desktop primeiro,
  mobile depois" nem o contrário: as duas experiências são adaptações de primeira
  classe do mesmo layout, revisadas juntas a cada tela construída.

## Módulos (7 abas)

1. **Visão Geral** — patrimônio total consolidado, variação do dia, alocação por
   classe de ativo (renda fixa / cripto / ações), lista de contas conectadas (Pierre),
   gráfico de evolução (12 meses), score médio da carteira (gauge). O card do gauge é
   inteiro clicável e leva para a aba de sinais; o convite é um **CTA com peso próprio**
   (botão contornado em `--accent`), não um trecho sublinhado no meio do parágrafo — o
   score explicável é o diferencial do produto e a porta de entrada dele não pode ficar
   subordinada ao próprio gráfico. Como o card inteiro é o link, o CTA é um `<span>`
   estilizado, nunca um `<a>` aninhado.
2. **Renda Fixa** — lista de posições (CDB, Tesouro, LCI/LCA...), rentabilidade vs.
   CDI/Selic, comparação visual entre elas.
3. **Cripto** — carteira de criptomoedas, preços e variação, série histórica por ativo.
4. **Ações / Renda Variável** — carteira de ações/FIIs, desempenho, indicadores básicos.
5. **Análise & Sinais** — lista de oportunidades/cenários identificados, cada um com
   score (gauge) + breakdown de fatores + disclaimer. Núcleo diferencial do produto.
6. **Notícias & Radar de Mercado** — feed categorizado (Selic/Copom, cripto, ações,
   bancos), cada item resumido, servindo de contexto para os sinais da aba 5.
7. **Simulador / Ferramentas** — calculadoras: comparador CDB x Tesouro x poupança,
   simulador de aporte mensal, projeção de patrimônio.

## Tratamento de erro, loading e vazio

- Estados de loading reais via `loading.tsx`/Suspense, alimentados pela latência
  simulada da camada de dados — os skeletons construídos agora já são os do produto
  final.
- Estados vazios (ex: nenhum sinal no momento) tratados como "convite à ação", na voz
  da interface, não como erro.
- Como não há chamadas de rede reais, não há tratamento de erro de API nesta fase —
  isso entra quando o backend real (specs 2–4) existir.

## Testes

- `tsc` e lint como gate de qualidade.
- Testes unitários para lógica com regra real: formatação de moeda (`Money`/BRL),
  cálculo de variação percentual, cálculo do preenchimento do gauge a partir do score.
- Sem testes de integração/e2e nesta fase (não há backend).

## Decisões registradas (resumo do brainstorming)

- Stack: Next.js (App Router) + shadcn/ui, não Angular.
- Legado Omnia: deletado do repositório (não arquivado).
- Alvo: web app responsivo único (não native app separado agora).
- Sem autenticação nesta fase.
- Dados mocados incluem histórico simulado (não só retrato atual).
- Score de confiança sempre com breakdown de fatores (nunca caixa-preta).
- Estilo visual: Terminal Escuro, navegação top-nav → hambúrguer no mobile.
- Nome do app: "Radar" (placeholder, trivialmente trocável).
- Estrutura de repo: app na raiz (sem monorepo).
- Bancos mocados: Banco do Brasil, Nubank, Sicredi, Mercado Pago (via Pierre).

## Revisão de design system — 2026-07-27

Auditoria de usabilidade/consistência sobre o front-end já construído. O que mudou, e
por quê (todas as decisões acima já refletem o estado final):

1. **Escala tipográfica explícita.** O mesmo `<h2>` tinha três pesos visuais diferentes
   dependendo do componente em que nasceu (título de sinal `text-lg` semibold, título de
   painel `text-base`, header de gráfico `text-sm` cinza). A página inteira ficava
   achatada: label de dado e header de seção eram idênticos. Passa a existir a escada de
   quatro degraus (`components/common/typography.tsx`); o nível do heading passa a seguir
   a hierarquia do documento — `FactorBreakdown` ganhou `headingLevel` para não pular de
   `h1` para `h3` na tela de detalhe do sinal.
2. **Cores de gráfico viram tokens.** `AllocationChart` misturava `var(--accent)` com hex
   cru; agora usa `--asset-fixed-income` / `--asset-crypto` / `--asset-equity`. O verde de
   ações (`#2ea043`, quase idêntico ao `--positive` `#3fb950`) virou teal `#2dd4bf` para
   que cor de classe e cor de variação nunca se confundam.
3. **Um único recipe de card.** Havia `p-4`, `p-5`, `p-6` e `p-4 sm:p-5` para o mesmo
   padrão visual; `surfaceCardClass` padroniza no par responsivo.
4. **CTA do gauge na visão geral.** Antes: card inteiro clicável, mas só um trecho de
   texto sublinhado parecia link (sugerindo que só aquele pedaço era clicável), e o
   convite tinha peso `text-xs`. Agora o CTA é um botão contornado.
5. **Instituições com fonte única** (`lib/shared/institutions.ts`) — os hex de marca
   estavam duplicados entre fixtures e mapper da Pierre.
6. **Regras implícitas documentadas** em vez de "corrigidas": a elevação `--bg` dentro de
   `--surface` e a escolha `fr` vs `px` em grid são intencionais e agora estão escritas
   (aqui, e em comentário no `globals.css` / nos componentes).
7. **Alvo de toque da nav desktop** de `py-2` (~36px) para `py-2.5` (~40px), pensando em
   tablet — que cai no breakpoint `lg` e usa toque.

Confirmado na auditoria e mantido como está: contraste (todos os pares principais passam
AA, vários AAA), `FactorBreakdown` não depender só de cor (`+`/`−`/`=` com `aria-label`),
`aria-hidden` no SVG do gauge com `role="img"` no `<figure>`, nav mobile com `py-3`,
`tabular-nums` + `font-mono` em todo número financeiro.
