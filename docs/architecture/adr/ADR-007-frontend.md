# ADR-007 — Frontend: Angular standalone + signals + Material + Tailwind

- Status: Aceito · Data: 2026-07-19

## Decisão

- Angular estável mais recente, **somente standalone components**, controle de fluxo novo (`@if/@for`),
  **signals** como primitiva de estado (RxJS reservado a fluxos assíncronos: HTTP, websockets, eventos).
- **Estado**: services com signals (`signal/computed/effect`) por domínio; sem NgRx na v1 —
  critério de adoção: quando surgir estado global com múltiplos escritores e necessidade de devtools/undo.
- **UI**: Angular Material (theming M3 com CSS custom properties → tema por tenant e dark/light)
  - TailwindCSS para layout/espaçamento. Componentes de design system próprios em `shared/ui`.
- **Roteamento**: lazy loading por módulo de negócio (espelha o backend), guards por permissão,
  resolvers para dados críticos de rota.
- **SSR**: apenas nas páginas públicas (agendamento online do tenant, sites); app logada é SPA.

## Justificativa

Standalone+signals é a direção oficial do framework (menos boilerplate, melhor performance com
change detection zoneless). Material dá acessibilidade e componentes maduros; Tailwind dá velocidade
de layout sem CSS ad-hoc. Tema por CSS variables viabiliza white-label por tenant em runtime.

## Consequências

- (+) Base alinhada ao futuro do Angular; theming por tenant nativo.
- (−) Disciplina para não misturar RxJS e signals sem critério — regra no CodingStyle.
