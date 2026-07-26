import type { Signal } from '@/lib/types';

export const SIGNAL_DISCLAIMER =
  'Não é recomendação de compra. Reflete o cenário atual do mercado.';

export const signals: Signal[] = [
  {
    id: 'sig-cdb-longo',
    title: 'Janela favorável para travar CDI longo',
    assetClass: 'rendaFixa',
    score: 82,
    summary:
      'Com a Selic em 14,25% e o mercado precificando cortes a partir do primeiro trimestre de 2027, prefixar ou travar percentual de CDI acima de 110% em prazos longos tende a ficar mais raro nos próximos meses.',
    factors: [
      {
        label: 'Selic mantida em 14,25% há 3 reuniões do Copom',
        direction: 'positive',
        weight: 30,
      },
      {
        label: 'Curva de juros futuros aponta corte a partir de 2027',
        direction: 'positive',
        weight: 26,
      },
      { label: 'IPCA 12m em 4,62%, dentro da banda da meta', direction: 'positive', weight: 18 },
      {
        label: 'Liquidez apenas no vencimento reduz flexibilidade',
        direction: 'negative',
        weight: 16,
      },
      { label: 'Risco de crédito do emissor acima do Tesouro', direction: 'neutral', weight: 10 },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-26T06:00:00.000Z',
  },
  {
    id: 'sig-btc-concentracao',
    title: 'Concentração em Bitcoin acima do usual da carteira',
    assetClass: 'cripto',
    score: 47,
    summary:
      'A alta recente elevou a fatia de BTC na carteira sem novos aportes. O cenário segue construtivo, mas a concentração amplifica o efeito de uma correção sobre o patrimônio total.',
    factors: [
      { label: 'BTC acumula +44% em 90 dias', direction: 'positive', weight: 28 },
      {
        label: 'Fluxo positivo em ETFs à vista nas últimas 4 semanas',
        direction: 'positive',
        weight: 22,
      },
      {
        label: 'Participação de cripto subiu para 1/3 do patrimônio',
        direction: 'negative',
        weight: 30,
      },
      {
        label: 'Volatilidade de 90 dias acima da média histórica',
        direction: 'negative',
        weight: 20,
      },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-26T06:00:00.000Z',
  },
  {
    id: 'sig-fii-juros',
    title: 'FIIs de tijolo pressionados pelo juro real',
    assetClass: 'acoes',
    score: 38,
    summary:
      'Juro real elevado mantém a renda fixa competitiva frente ao dividend yield dos FIIs. O prêmio atual não compensa o risco de vacância no curto prazo.',
    factors: [
      {
        label: 'Juro real acima de 9% torna a renda fixa competitiva',
        direction: 'negative',
        weight: 34,
      },
      { label: 'Vacância do setor logístico em leve alta', direction: 'negative', weight: 24 },
      {
        label: 'Dividend yield de 9,1% acima da média do setor',
        direction: 'positive',
        weight: 24,
      },
      {
        label: 'Contratos atípicos dão previsibilidade de receita',
        direction: 'neutral',
        weight: 18,
      },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-25T06:00:00.000Z',
  },
  {
    id: 'sig-petr-dividendos',
    title: 'Ciclo de dividendos de estatais em revisão',
    assetClass: 'acoes',
    score: 61,
    summary:
      'O yield projetado segue entre os maiores da bolsa, mas mudanças na política de distribuição e no plano de investimentos adicionam incerteza à previsibilidade do fluxo.',
    factors: [
      { label: 'Dividend yield projetado de 11,4%', direction: 'positive', weight: 32 },
      { label: 'Brent estável na faixa dos últimos 60 dias', direction: 'positive', weight: 22 },
      {
        label: 'Revisão do plano de investimentos pressiona o payout',
        direction: 'negative',
        weight: 28,
      },
      { label: 'Risco político recorrente em estatais', direction: 'negative', weight: 18 },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-24T06:00:00.000Z',
  },
];
