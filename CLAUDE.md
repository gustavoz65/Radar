# CLAUDE.md — Contexto para agentes de IA

Você está no repositório do **Radar** (nome provisório), uma plataforma pessoal de
inteligência financeira. Ela centraliza os dados de Open Finance do usuário (via Pier,
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

1. **Frontend / dashboard** — Next.js, dados mocados. Em andamento.
2. Integração Open Finance real (Pier). Ainda não iniciado.
3. Ingestão de dados de mercado (cripto, ações, CDI/Selic, notícias). Ainda não iniciado.
4. Motor de análise probabilística (IA / score de confiança). Ainda não iniciado.

Enquanto só o item 1 existe, **não invente integrações reais** — toda leitura de dados
passa pela camada de serviço mocada (`lib/data/services.ts`) descrita na spec do
frontend. Isso é intencional: quando os itens 2–4 forem construídos, só o interior
dessas funções muda.

## Regras inegociáveis

1. **Todo score de confiança precisa de breakdown visível dos fatores + disclaimer.**
   Nunca uma caixa-preta, nunca uma recomendação direta de compra/venda.
2. **A cor de assinatura do score (`--signature-gold`) nunca é reaproveitada** para
   variação de preço (alta/baixa usam `--positive`/`--negative`). São conceitos
   diferentes e devem ser visualmente distintos.
3. **Toda tela é responsiva de verdade** — desktop e mobile são adaptações de primeira
   classe do mesmo layout, revisadas juntas, nunca "desktop primeiro, mobile depois".
4. **Sem chamada de rede direta em componente.** Toda leitura de dados passa por
   `lib/data/services.ts` (funções async com a assinatura da futura API real). Nunca
   importe fixtures diretamente num componente de UI.
5. **Sem logos oficiais de banco.** Instituições mocadas usam badge com iniciais/cor
   própria — evita qualquer dependência de asset de marca.
6. **Dinheiro sempre formatado como BRL**; datas/horas tratadas como `Date`/ISO string
   nos fixtures (sem fuso a resolver nesta fase — dados são mocados).
7. **Conventional Commits**; commits pequenos.
8. Sem autenticação, sem multi-usuário, sem testes e2e nesta fase (specs 2-4 mudam isso).

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
