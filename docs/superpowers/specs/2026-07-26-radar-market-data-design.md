# Radar — Ingestão de Dados de Mercado (sub-projeto 3)

**Data:** 2026-07-26
**Status:** Aprovado para plano de implementação (depende do sub-projeto 2 para
banco de dados e infraestrutura de sync já existirem)

## Contexto

Sub-projeto 3 de 4 do Radar (ver spec do
[frontend](2026-07-26-radar-frontend-mvp-design.md)). Fornece os dados externos de
mercado — indicadores econômicos, cotações e notícias — que alimentam as abas Renda
Fixa/Cripto/Ações e, futuramente, o motor de análise
([sub-projeto 4](2026-07-26-radar-ai-scoring-engine-design.md)).

## Fontes de dados (pesquisadas e validadas)

| Dado                   | Fonte                                                                | Custo/limite                          | Observação                                                                           |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| Selic, CDI             | **BCB SGS** — `api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados` | Grátis, sem autenticação              | Série 11 = Selic (meta definida pelo Copom). Série 12 = CDI.                         |
| Ações, FIIs, BDRs (B3) | **brapi.dev**                                                        | Grátis com token: 15.000 req/mês      | 4 ativos (PETR4, MGLU3, VALE3, ITUB4) funcionam sem token, para teste                |
| Criptomoedas           | **CCXT** (`npm install ccxt`) — API unificada sobre 100+ exchanges   | Grátis, sem chave para dados públicos | Ler pares **/BRL** direto (Binance, Mercado Bitcoin, Foxbit): sem conversão de moeda |
| Notícias               | RSS do **InfoMoney** e **Investing.com Brasil**                      | Grátis                                | Sem API key; parse de XML server-side                                                |

## Escopo

- Rotas server-side que buscam cada fonte e normalizam para os contratos internos do
  Radar (mesmos tipos já definidos no sub-projeto 1: `TimeSeriesPoint`, `NewsItem`,
  além de um novo `EconomicIndicator`).
- Persistência histórica no mesmo MySQL (Docker Compose) do sub-projeto 2 — cada sync grava um
  novo ponto na série, construindo o histórico ao longo do tempo (essas APIs dão o
  presente/recente, não necessariamente anos de histórico gratuito).
- Cripto cotada **direto em BRL** via CCXT, lendo pares `BTC/BRL`, `ETH/BRL` etc. Se um
  ativo só existir contra USDT na exchange escolhida, aí sim converter — usando PTAX do
  BCB, que já é uma fonte do projeto.
- Categorização de notícias por palavra-chave/heurística simples (Selic/Copom, cripto,
  ações, bancos) — regra determinística, sem IA nesta fase.

## Fora de escopo

- Web scraping de sites sem RSS.
- Análise de sentimento de notícias por IA (isso é do sub-projeto 4).
- Dados de nível institucional/pago (Bloomberg, Refinitiv etc.) — fora de cogitação
  para uso pessoal.
- Cotações em tempo real/intraday de alta frequência — o produto é para acompanhamento,
  não trading.

## Arquitetura

- Mesmo padrão do sub-projeto 2: **Next.js Route Handlers** (`app/api/market/*`),
  chamadas nas fontes externas feitas só no servidor.
- **Sincronização sob demanda**: o mesmo botão "Atualizar agora" da Visão Geral também
  atualiza indicadores/cotações/notícias (uma chamada, várias fontes em paralelo).
- **Debounce**: para não gastar cota (brapi) nem tomar ban de exchange (CCXT), a rota
  ignora novo fetch de uma fonte se o último sync foi há menos de N minutos
  (configurável; sugestão inicial: 15 min) e serve o dado em cache do banco.

### Regras de uso da CCXT

Três restrições que a implementação precisa respeitar:

1. **Nunca instanciar com `apiKey`/`secret`.** O Radar é read-only sobre dado financeiro
   (restrição global do produto) e a CCXT é uma biblioteca de _trading_ — sem credencial,
   os métodos privados (`createOrder`, `withdraw`) são inalcançáveis por construção.
2. **Uma instância por exchange, reutilizada.** O rate limiter da CCXT vive na instância;
   criar uma nova a cada request reinicia o limitador e leva a ban. Mesmo padrão do pool
   do MySQL em `lib/db/client.ts`.
3. **Só no servidor.** A biblioteca tem alguns MB; entra em Route Handler, nunca em
   componente de cliente.

## Modelo de dados (novas tabelas)

- `economic_indicator { id, series ('selic'|'cdi'), value, reference_date }`
- `market_price { id, asset_class ('acoes'|'cripto'), ticker, price_brl, change_pct, collected_at }`
- `market_price_history` — série temporal por ticker, para os gráficos de evolução.
- `news_item { id, title, source, url, published_at, category, summary }`

## Tratamento de erro

- Cada fonte é buscada de forma independente — falha numa (ex: brapi fora do ar) não
  impede as outras de atualizar. A tela mostra o dado em cache com a data da última
  coleta bem-sucedida daquela fonte especificamente.

## Testes

- Unitários: parsing de cada fonte (BCB SGS, brapi, CCXT, RSS) para os tipos internos,
  incluindo casos de resposta vazia/malformada. A CCXT é mockada — a suíte nunca chama
  uma exchange de verdade.
- Unitários: heurística de categorização de notícias.
- Integração: rota de sync com as quatro fontes mockadas, cobrindo sucesso parcial
  (algumas fontes falham, outras não) e o debounce de cota.
