# Radar — Motor de Análise Probabilística / Score de Confiança (sub-projeto 4)

**Data:** 2026-07-26
**Status:** Aprovado para plano de implementação — **piloto restrito a Renda Fixa**

## Contexto

Sub-projeto 4 de 4 do Radar, o núcleo diferencial do produto (ver spec do
[frontend](2026-07-26-radar-frontend-mvp-design.md)). Gera o `Signal` (score +
breakdown de fatores + disclaimer) exibido na aba Análise & Sinais, consumindo os dados
reais dos sub-projetos 2 ([Pierre](2026-07-26-radar-pierre-integration-design.md)) e 3
([dados de mercado](2026-07-26-radar-market-data-design.md)).

É a parte mais nova e arriscada do projeto — por isso o piloto cobre **só Renda Fixa**
(CDB, Tesouro Selic, LCI/LCA), cuja lógica é mais objetiva e mensurável. Ações e cripto
ficam para uma iteração seguinte desta mesma linha, depois que o piloto validar a
abordagem.

## Princípio central: score nunca é uma caixa-preta

O usuário foi explícito: quer noção do que é real e do que não é. Isso exige que o
**score numérico nunca seja gerado por um LLM "no chute"** — precisa ser reproduzível e
auditável.

**Decisão de método: híbrido.**

1. Uma **fórmula determinística** calcula o score (0–100) a partir de fatores
   mensuráveis extraídos dos dados reais. A fórmula e os pesos ficam versionados em
   código/config — dado o mesmo input, sempre produz o mesmo score.
2. Uma camada de **IA (Claude, via Anthropic API)** entra só para:
   - traduzir cada fator calculado num rótulo textual curto do breakdown (ex: "Selic
     em alta há 3 reuniões");
   - ler as notícias relevantes (do sub-projeto 3) e resumir/rotular o contexto
     qualitativo (ex: "notícias recentes sobre o setor bancário: neutras");
   - escrever o resumo em linguagem natural e o disclaimer.
3. **A IA nunca recebe permissão de alterar o valor numérico do score** — ela consome o
   resultado da fórmula, não o produz.

## Fatores do piloto (Renda Fixa)

Cada fator tem um peso fixo e contribui para o score final normalizado 0–100. Lista
inicial (a refinar durante a implementação com dados reais):

| Fator                                                                | Fonte                                                                | Direção                                                                                        |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tendência da Selic/CDI nas últimas reuniões do Copom                 | sub-projeto 3 (BCB SGS)                                              | Selic subindo favorece pós-fixados                                                             |
| Rentabilidade contratada vs. CDI/Selic atual (ex: "110% do CDI")     | sub-projeto 2 (posição cadastrada) + sub-projeto 3 (indicador atual) | Quanto maior o % sobre o indicador, melhor                                                     |
| Liquidez (diária vs. carência/vencimento)                            | sub-projeto 2 (posição cadastrada)                                   | Liquidez diária = mais flexível, mas não necessariamente "melhor" para o score — é informativo |
| Exposição ao limite de garantia do FGC (R$ 250k por CPF/instituição) | sub-projeto 2 (posições agregadas por instituição)                   | Acima do limite = fator de alerta, não de score em si                                          |
| Contexto de notícias recentes sobre o emissor/mercado de renda fixa  | sub-projeto 3 (notícias) + IA (resumo)                               | Qualitativo, peso menor que os fatores acima                                                   |

## Escopo

- Cálculo do score de Renda Fixa a partir dos fatores acima.
- Geração do breakdown (lista de fatores com direção +/−/neutro) e do texto explicativo
  via Claude.
- Endpoint/rotina que recalcula os `Signal`s de Renda Fixa a cada sincronização (reusa
  o botão "Atualizar agora" dos sub-projetos 2/3 — o cálculo roda depois que os dados
  novos chegam).

## Fora de escopo

- Ações e criptomoedas — ficam para expandir esta mesma spec depois que o piloto rodar
  na prática com Renda Fixa.
- Qualquer garantia de acurácia preditiva — o disclaimer fixo ("Não é recomendação de
  compra. Reflete o cenário atual do mercado.") continua obrigatório em todo `Signal`.
- Back-testing formal do modelo (comparar scores passados com desempenho real
  subsequente) — interessante como validação futura, não bloqueia o piloto.
- Ajuste automático de pesos (aprendizado de máquina) — os pesos são fixos e definidos
  por nós, não aprendidos; mantém a fórmula auditável.

## Arquitetura

- Rotina server-side (Next.js Route Handler ou job) que, após um sync bem-sucedido dos
  sub-projetos 2/3, recalcula os `Signal`s de Renda Fixa e persiste no banco (mesma
  tabela `signal` já modelada conceitualmente no sub-projeto 1, agora populada de
  verdade em vez de fixture).
- Chamada ao Claude (Anthropic API) isolada numa função própria (`explainSignal(factors, news)`)
  que recebe só os fatores já calculados e as notícias relevantes — nunca o histórico
  bruto completo, para manter o prompt pequeno e o resultado focado.
- Cache: como o score só muda quando há novo sync, não há necessidade de recalcular a
  todo request — é calculado uma vez por sync e lido do banco pelas telas.

## Tratamento de erro

- Se a chamada à IA falhar (rate limit, erro de rede), o score determinístico e o
  breakdown numérico ainda são salvos e exibidos — só o texto explicativo em prosa fica
  com um fallback genérico ("Resumo indisponível — score calculado normalmente") até a
  próxima sincronização.

## Testes

- Unitários: cada fator da fórmula isoladamente (inputs conhecidos → output esperado),
  e a normalização final para 0–100.
- Unitários: a fórmula é determinística — mesmo input sempre produz o mesmo score
  (teste de regressão simples).
- Integração: `explainSignal` com resposta da IA mockada, garantindo que o score
  retornado ao front-end é sempre o calculado pela fórmula, nunca um valor vindo da
  resposta da IA.
