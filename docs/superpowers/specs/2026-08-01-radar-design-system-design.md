# Radar — Design system "Terrain"

Data: 2026-08-01
Status: implementado
Escopo: todas as telas do app (8 abas + detalhe de sinal + login + 404)

Esta spec substitui a seção visual do
`2026-07-26-radar-frontend-mvp-design.md`. As decisões de dado, contrato e
arquitetura daquela spec continuam valendo — o que muda aqui é a linguagem
visual, o sistema de tokens e o sistema de movimento.

---

## 1. Crítica do que existia

O MVP era funcional e disciplinado (um degrau tipográfico, uma receita de card,
tokens de cor com semântica clara). O problema não era desleixo, era **ausência
de identidade**: o app parecia o dark dashboard padrão que qualquer projeto
shadcn produz na primeira semana.

1. **Sem assinatura visual.** Card `bg-surface` arredondado sobre `bg-bg`, borda
   de 1px em todos, mesma cadência em todas as abas: título → 4 StatCards →
   cards. Nada na tela dizia "Radar".
2. **Hierarquia de elevação inexistente na prática.** `--bg` (#0a0e14) e
   `--surface` (#0d1117) diferem em ~3 pontos de luminância — invisível. Pior:
   `--bg` acumulava dois papéis (fundo da página **e** recesso dentro do card),
   documentado como intencional. O resultado é que um input dentro de um card
   não parecia afundado, parecia um buraco na página.
3. **Um só volume tipográfico.** `SectionHeader` era `text-xl/2xl` semibold —
   quase do mesmo tamanho de `PanelTitle`. Não havia degrau de display. A
   personalidade de uma tela de instrumento vem justamente do contraste entre um
   título grande e respirado e microlabels minúsculos em mono; o Radar tinha uma
   voz só, em três tamanhos.
4. **Zero textura.** Preenchimentos chapados. Nenhuma camada ambiente.
5. **Zero movimento.** Nenhuma transição de rota, nenhuma entrada, nenhum
   desenho de gráfico. Navegar era um corte seco: o conteúdo aparecia de
   estalo, e num app onde cada aba faz round-trip no MySQL, o clique não tinha
   retorno nenhum até a página trocar.
6. **Semântica de cor embaralhada.** `--asset-fixed-income` era literalmente
   `var(--accent)`. Um chip de legenda "Renda fixa" e um link tinham exatamente
   a mesma cor, e mexer no azul de interação repintava o gráfico de alocação
   sem ninguém pedir.
7. **Loading mentia sobre o layout.** `TabSkeleton` usava blocos cinza
   (`bg-muted` + `animate-pulse`) que não tinham a forma da tela que substituíam
   — o conteúdo pulava ao chegar, e o pulse forte lia como alerta no escuro.
8. **O ouro estava desperdiçado.** `--signature-gold` é a única cor realmente
   própria do produto e aparecia num ponto de 8px e num gauge.
9. **Login, 404 e empty state eram órfãos.** Nenhum compartilhava a linguagem do
   shell; pareciam telas de outro app.
10. **Botão sem receita.** Cada ação escrevia seu próprio
    `rounded-md bg-accent px-4 py-2` na mão.

---

## 2. O conceito

**Terrain.** O produto é um instrumento lendo um campo. A tela inteira assenta
sobre um terreno medido: uma malha de linhas, uma matriz de pontos que forma
contornos e se dissolve nas bordas, e uma varredura de radar passando devagar.
Sobre esse campo ficam painéis emoldurados por cantoneiras, números em mono
tabular e microlabels minúsculos.

Nada disso é imagem: as três camadas são gradientes CSS. Não há asset para
baixar, não há dependência de marca e um único ajuste de token retempera a
atmosfera inteira.

---

## 3. Tokens (`app/globals.css`)

### Elevação — quatro degraus, um papel cada

| token              | valor     | papel                                         |
| ------------------ | --------- | --------------------------------------------- |
| `--bg`             | `#070a0f` | a página, atrás de tudo                       |
| `--surface`        | `#0d1117` | card/painel elevado sobre a página            |
| `--surface-raised` | `#141b24` | card sob o ponteiro, popover, ênfase aninhada |
| `--well`           | `#04060a` | recesso **dentro** de um surface              |

`--well` existe para desfazer a sobrecarga de `--bg`. Um input, um disclaimer e
o item ativo do menu são recessos e agora são mais escuros que a página.

### Bordas, texto

`--border` (#1b212b) separa; `--border-strong` (#2b3441) emoldura.
Texto em quatro degraus: `--text` → `--text-dim` (o cinza do título display) →
`--text-muted` → `--text-faint` (microlabel mono).

### Cor semântica — quatro conceitos que nunca se cruzam

- **Direção de preço**: `--positive` / `--negative`. Só isso.
- **Confiança**: `--signature-gold`. Só o gauge e o StatCard cujo número **é** um
  score (`tone="score"`).
- **Classe de ativo**: `--asset-fixed-income` / `--asset-crypto` /
  `--asset-equity`. Renda fixa deixou de ser um alias de `--accent` e tem valor
  próprio (#3d7dd8): o acoplamento fazia o gráfico de alocação mudar junto com o
  azul de link.
- **Interação** (link, foco, marcador de aba ativa, ação primária): `--accent`.

O ouro **não** foi promovido a cor de chrome. Fora do score ele aparece em
exatamente um lugar: o contato piscando na marca.

### Movimento

`--dur-1` 120ms (estado) · `--dur-2` 220ms (componente) · `--dur-3` 420ms
(entrada) · `--dur-4` 900ms (dado). `--ease-out` para tudo que chega,
`--ease-in-out` para tudo que faz loop. `--stagger-step` 45ms.

### Terreno

`--terrain-dot`, `--terrain-grid`, `--terrain-sweep`, `--terrain-dot-size`,
`--terrain-grid-size`.

---

## 4. Sistema de movimento

Três verbos, e só três:

| verbo     | onde                                                     |
| --------- | -------------------------------------------------------- |
| `rise`    | uma rota, um card, uma linha chega (translate + opacity) |
| `fade`    | chega sem se mover                                       |
| `stagger` | um conjunto chega em ordem de leitura                    |

Mais três loops ambientes: `sweep` (a varredura, 24s), `blip` (o contato da
marca e o ponto de status de sync), `scan` (barra de pendência no link clicado e
no botão de sync), `shimmer` (skeleton).

E dois de dado: `draw` (o arco do gauge se desenhando) e `grow-x` (as barras do
breakdown de fatores crescendo em sequência).

Decisões:

- **Sem biblioteca de animação.** Tudo é CSS + um `requestAnimationFrame` no
  `Readout`. Zero KB adicionais no bundle, funciona dentro de server component.
- **`stagger` por `nth-child`, não por wrapper.** Um wrapper por filho viraria o
  item do grid e engoliria qualquer `col-span` que o filho declarasse.
- **Transição de rota só na entrada.** `PageTransition` remonta com `key={pathname}`
  e replica o `rise`. Saída exigiria manter a árvore antiga viva — máquina de
  estado + biblioteca, caro demais para 420ms.
- **Pendência é por link.** `useLinkStatus` (Next 15.3+) só reporta para o
  `<Link>` em que está renderizado, que é exatamente a granularidade desejada:
  a aba clicada é a que varre.
- **`prefers-reduced-motion` tem um único interruptor**, no fim do
  `globals.css`. Loops ambientes somem; entradas colapsam para o estado final
  (não são removidas — o que animou não pode ficar invisível). Recharts anima
  por JS e não é alcançado por CSS, então cada gráfico consulta
  `useReducedMotion()`.

---

## 5. Componentes do sistema

| arquivo                           | papel                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `common/terrain.tsx`              | as três camadas ambientes                                                            |
| `common/typography.tsx`           | `DisplayTitle` · `Eyebrow` · `PanelTitle` · `SubsectionTitle` · `DataLabel`          |
| `common/surface.ts`               | `surfaceCardClass` · `wellClass` · `instrumentCardClass` · `interactiveSurfaceClass` |
| `common/action.ts`                | `primaryActionClass` · `secondaryActionClass` · `dangerActionClass`                  |
| `common/motion.tsx`               | `staggerClass` · `<Reveal>`                                                          |
| `common/page-transition.tsx`      | entrada por rota                                                                     |
| `common/readout.tsx`              | número que se acomoda até o valor                                                    |
| `common/section-header.tsx`       | eyebrow + display + régua, cabeçalho de toda rota                                    |
| `common/stat-card.tsx`            | leitura única, com `tone` por classe de ativo                                        |
| `charts/chart-theme.ts`           | tooltip, eixo, grid e timing compartilhados do Recharts                              |
| `shell/radar-mark.tsx`            | a marca desenhada                                                                    |
| `shell/current-section.tsx`       | nome da aba no header mobile                                                         |
| `lib/hooks/use-reduced-motion.ts` | a ponte CSS→JS para o Recharts                                                       |

`instrumentCardClass` marca o painel que carrega uma **leitura** (score,
patrimônio) e não apenas uma lista: duas cantoneiras em `--border-strong` sobre
a própria borda. A receita nunca inclui `overflow-hidden` — as cantoneiras ficam
em `-1px` e seriam recortadas.

`Readout` renderiza o valor final no servidor e anima a partir dele no cliente.
Sem JS o número está certo; depois de um sync, cada leitura viaja visivelmente
do valor anterior ao novo, então um número que mudou é impossível de perder.

---

## 6. Regras que a implementação passa a garantir

1. Toda rota abre com `SectionHeader` (eyebrow + display + régua). Não existe
   `<h1>` solto.
2. Toda cor vem de token. Nenhum hex cru fora de `globals.css` — incluindo
   dentro de gráfico. A única exceção é `institution.color`, que é **dado**, não
   design.
3. Todo card usa uma das receitas de `surface.ts`; toda ação usa uma de
   `action.ts`.
4. Todo grid de cards/linhas usa `staggerClass`.
5. Toda animação nova declara duração em `--dur-*` e curva em `--ease-*`, e não
   precisa de guarda própria de reduced-motion — a global cobre.
6. Desktop e mobile são revisados juntos, sempre. As telas desta spec foram
   verificadas em 1440px e 390px.

---

## 7. O que ficou de fora, deliberadamente

- **Animação de saída de rota.** Custo desproporcional (ver §4).
- **Tema claro.** O app é permanentemente escuro; não há toggle nesta fase nem
  planejado.
- **Ouro como cor de chrome.** Diluiria a única cor que significa "confiança".
- **Mover o botão de sync para o header.** É uma mudança de produto (a ação hoje
  vive só na Visão geral), não de design — fica registrada como observação.
