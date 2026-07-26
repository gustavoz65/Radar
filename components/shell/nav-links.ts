export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: '/visao-geral', label: 'Visão geral' },
  { href: '/renda-fixa', label: 'Renda fixa' },
  { href: '/cripto', label: 'Cripto' },
  { href: '/acoes', label: 'Ações' },
  { href: '/sinais', label: 'Análise e sinais' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/ferramentas', label: 'Ferramentas' },
];
