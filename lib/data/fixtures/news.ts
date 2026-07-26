import type { NewsItem } from '@/lib/types';

export const news: NewsItem[] = [
  {
    id: 'nw-01',
    title: 'Copom mantém Selic em 14,25% pela terceira reunião consecutiva',
    source: 'Banco Central',
    publishedAt: '2026-07-25T21:30:00.000Z',
    category: 'selic',
    summary:
      'Comitê cita inflação de serviços resistente e sinaliza que a manutenção deve durar enquanto as expectativas não convergirem à meta.',
  },
  {
    id: 'nw-02',
    title: 'Fluxo em ETFs de Bitcoin soma quarta semana positiva',
    source: 'Radar Cripto',
    publishedAt: '2026-07-25T14:10:00.000Z',
    category: 'cripto',
    summary:
      'Entrada líquida acumulada no mês reforça a demanda institucional, embora o volume semanal venha desacelerando.',
  },
  {
    id: 'nw-03',
    title: 'Ibovespa fecha em alta puxado por bancos e petróleo',
    source: 'Mercado Hoje',
    publishedAt: '2026-07-25T21:05:00.000Z',
    category: 'acoes',
    summary:
      'Índice sobe com apoio das blue chips; giro financeiro fica acima da média de 30 dias.',
  },
  {
    id: 'nw-04',
    title: 'Bancos ampliam oferta de CDB com liquidez diária acima de 100% do CDI',
    source: 'Valor Investe',
    publishedAt: '2026-07-24T18:40:00.000Z',
    category: 'bancos',
    summary:
      'Disputa por captação leva emissores médios a elevar as taxas oferecidas ao investidor pessoa física.',
  },
  {
    id: 'nw-05',
    title: 'IPCA-15 de julho vem em 0,32% e desacelera na margem',
    source: 'IBGE',
    publishedAt: '2026-07-24T12:00:00.000Z',
    category: 'selic',
    summary: 'Alimentação no domicílio recua, mas serviços seguem pressionando o núcleo do índice.',
  },
  {
    id: 'nw-06',
    title: 'Ethereum avança em atualização de escalabilidade',
    source: 'Radar Cripto',
    publishedAt: '2026-07-23T16:25:00.000Z',
    category: 'cripto',
    summary:
      'Testnet conclui etapa prevista no roteiro; ativação em mainnet segue sem data confirmada.',
  },
  {
    id: 'nw-07',
    title: 'Fundos imobiliários registram saída líquida em julho',
    source: 'Mercado Hoje',
    publishedAt: '2026-07-23T13:15:00.000Z',
    category: 'acoes',
    summary:
      'Juro real elevado mantém a competição da renda fixa por recursos do investidor pessoa física.',
  },
  {
    id: 'nw-08',
    title: 'Open Finance ultrapassa marca de compartilhamentos ativos recorde',
    source: 'Banco Central',
    publishedAt: '2026-07-22T19:00:00.000Z',
    category: 'bancos',
    summary: 'Crescimento vem principalmente de consentimentos para agregadores de investimentos.',
  },
  {
    id: 'nw-09',
    title: 'Tesouro Direto tem captação líquida positiva no semestre',
    source: 'Tesouro Nacional',
    publishedAt: '2026-07-22T11:20:00.000Z',
    category: 'selic',
    summary:
      'Tesouro Selic concentra a maior parte das aplicações, seguido pelos títulos indexados ao IPCA.',
  },
  {
    id: 'nw-10',
    title: 'Petrobras aprova distribuição trimestral dentro da política vigente',
    source: 'Valor Investe',
    publishedAt: '2026-07-21T22:45:00.000Z',
    category: 'acoes',
    summary:
      'Valor por ação fica em linha com as projeções; companhia reitera revisão do plano de investimentos.',
  },
];
