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
2. Os ADRs e docs de arquitetura antigos (`docs/architecture/`) descrevem o Omnia — não
   se aplicam ao Radar. Novos ADRs para o Radar, se necessários, vão em
   `docs/architecture/adr/` seguindo o mesmo formato.

## Como o projeto está dividido

Quatro sub-projetos independentes, cada um com sua própria spec e plano:

1. **Frontend / dashboard** — Next.js, dados mocados. **Construído** (7 abas, plano em
   `docs/superpowers/plans/2026-07-26-radar-frontend-mvp.md`).
2. Integração Open Finance real (Pierre — app da CloudWalk, `docs.pierre.finance`; o
   nome NÃO é "Pier"). Em andamento.
3. Ingestão de dados de mercado (cripto, ações, CDI/Selic, notícias). Ainda não iniciado.
4. Motor de análise probabilística (IA / score de confiança). Ainda não iniciado.

Toda leitura de dados passa por `lib/data/services.ts`. No item 1 essas funções retornam
fixtures; o item 2 substitui o **interior** delas por banco/Pierre sem que nenhum
componente de UI mude. Nunca chame a Pierre nem o banco direto de um componente, e nunca
importe fixture dentro de componente. Enquanto os itens 3–4 não existirem, **não invente
as integrações deles**.

## Regras inegociáveis

1. **Todo score de confiança precisa de breakdown visível dos fatores + disclaimer.**
   Nunca uma caixa-preta, nunca uma recomendação direta de compra/venda.
2. **A cor de assinatura do score (`--signature-gold`) nunca é reaproveitada** para
   variação de preço (alta/baixa usam `--positive`/`--negative`). São conceitos
   diferentes e devem ser visualmente distintos. Classe de ativo é um terceiro conceito,
   com tokens próprios (`--asset-fixed-income`/`--asset-crypto`/`--asset-equity`).
   **Nenhuma cor vive como hex cru fora de `app/globals.css`** — inclusive em gráfico.
3. **Toda tela é responsiva de verdade** — desktop e mobile são adaptações de primeira
   classe do mesmo layout, revisadas juntas, nunca "desktop primeiro, mobile depois".
4. **Sem chamada de rede direta em componente.** Toda leitura de dados passa por
   `lib/data/services.ts` (funções async com a assinatura da futura API real). Nunca
   importe fixtures diretamente num componente de UI.
5. **Sem logos oficiais de banco.** Instituições mocadas usam badge com iniciais/cor
   própria — evita qualquer dependência de asset de marca.
6. **Dinheiro sempre formatado como BRL**; datas/horas tratadas como `Date`/ISO string
   nos fixtures (sem fuso a resolver nesta fase — dados são mocados).
7. **Nada de estilizar heading solto.** Todo título/label usa um degrau de
   `components/common/typography.tsx` (`PanelTitle`/`SubsectionTitle`/`DataLabel`), e todo
   card usa `surfaceCardClass` de `components/common/surface.ts`. A tag (`h2`, `h3`) segue
   a hierarquia do documento; o peso visual vem do degrau, não da tag.
8. **Conventional Commits**; commits pequenos.
9. Sem autenticação, sem multi-usuário, sem testes e2e nesta fase (specs 2-4 mudam isso).

## Comandos

- `npm run dev` — servidor de desenvolvimento em http://localhost:3000
- `npm run build` — build de produção
- `npm run lint` — ESLint (next/core-web-vitals + TypeScript)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — testes unitários (Vitest)
- `npm run format` — Prettier em todo o repositório

## Layout esperado do frontend

```
app/                      # Next.js App Router — uma rota por aba
  (dashboard)/
    visao-geral/
    renda-fixa/
    cripto/
    acoes/
    sinais/
    noticias/
    ferramentas/
components/
  ui/                      # shadcn/ui
  <feature>/                # componentes específicos de cada aba
lib/
  data/
    fixtures/               # dados mocados
    services.ts              # getPortfolioSummary(), getSignals(), getNews()...
  types/                     # Account, Position, Signal, NewsItem...
```

## Como adicionar uma aba/módulo novo (receita)

1. Contrato de dados em `lib/types/` → fixture em `lib/data/fixtures/` → função em
   `lib/data/services.ts` com latência simulada.
2. Rota em `app/(dashboard)/<aba>/` com `loading.tsx` real (Suspense).
3. Componentes em `components/<feature>/` reaproveitando tokens de design (cores,
   Geist Sans/Mono, gauge dourado só para score de confiança).
4. Se a aba expõe um `Signal`, o breakdown de fatores + disclaimer é obrigatório.
