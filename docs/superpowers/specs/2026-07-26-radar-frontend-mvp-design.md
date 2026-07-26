# Radar — Frontend MVP (Investment Intelligence Dashboard)

**Data:** 2026-07-26
**Status:** Aprovado para plano de implementação

## Contexto

O repositório abandona por completo o produto anterior (Omnia, SaaS multi-tenant de
gestão para negócios de serviços, stack Java/Spring Modulith + Angular). O novo produto
é uma plataforma pessoal de inteligência financeira: centraliza dados de Open Finance
(via Pier, que já conecta os bancos do usuário) e cruza com indicadores econômicos,
notícias e histórico de mercado para gerar análises probabilísticas de apoio à decisão
de investimento — nunca uma recomendação direta de compra/venda.

O projeto completo se divide em quatro sub-projetos independentes, cada um com sua
própria spec e plano:

1. **Frontend / dashboard** — objeto desta spec.
2. Integração Open Finance real (Pier).
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

- Conexão real com a API da Pier / Open Finance.
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
já que qualquer agregador (Pier incluso) converge para esse formato — isso torna a
troca por dados reais mais direta:

- `Account { id, institution, type, balance, lastUpdated }`
- `Position { id, assetClass: 'rendaFixa'|'cripto'|'acoes', name, quantity, currentValue, history: TimeSeriesPoint[] }`
- `Signal { id, title, assetClass, score: number (0-100), factors: { label, direction: 'positive'|'negative'|'neutral' }[], summary, disclaimer }`
- `NewsItem { id, title, source, publishedAt, category, summary }`

### Instituições mocadas (via Pier)

Banco do Brasil, Nubank, Sicredi, Mercado Pago. Representadas por badge com iniciais/cor
própria (sem uso de logos oficiais — evita qualquer dependência de assets de marca).

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
   classe de ativo (renda fixa / cripto / ações), lista de contas conectadas (Pier),
   gráfico de evolução (12 meses), score médio da carteira (gauge).
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
- Bancos mocados: Banco do Brasil, Nubank, Sicredi, Mercado Pago (via Pier).
