# Radar — Integração Open Finance via Pierre (sub-projeto 2)

**Data:** 2026-07-26
**Status:** Aprovado para plano de implementação (depende do sub-projeto 1 já ter o
front-end e os contratos de dados mocados prontos)

## Contexto

Sub-projeto 2 de 4 do Radar (ver spec do
[frontend](2026-07-26-radar-frontend-mvp-design.md) para o contexto geral do produto).
Substitui a camada de dados mocada de contas/saldo por dados reais, via **Pierre**
(app da CloudWalk, não "Pier" — nome correto confirmado na documentação pública em
`docs.pierre.finance`), que já conecta os bancos do usuário (Banco do Brasil, Nubank,
Sicredi, Mercado Pago) via Open Finance, plano Pro (até 5 bancos).

### Achado importante: o que a Pierre realmente fornece

A API pública documentada da Pierre (`docs.pierre.finance`) cobre:

- `Get Accounts`, `Get Balance` / `Get Balance by Account` — contas e saldo.
- `Get Transactions`, `Get Expensive Categories`, `Get Installments` — histórico
  financeiro e parcelamentos.
- `Get Bills` / `Get Bill Summary` — faturas de cartão de crédito.
- `Manual Update` — sincroniza contas/transações com os bancos on-demand.
- Limites de gasto e lembretes de pagamento (funcionalidades internas da Pierre, não
  relevantes para o Radar).

**Não há endpoint documentado de posições de investimento** (renda fixa, ações,
cripto), apesar do marketing da Pierre mencionar "visão do que você tem investido". Ou
seja: a Pierre é fonte de **saldo em conta e transações**, não de carteira de
investimentos. Se ao gerar a API key real (`pierre.finance/api-key`) aparecer um
endpoint de investimentos não documentado, é um bônus a aproveitar — mas o design abaixo
não depende disso.

**Decisão:** posições de investimento (CDB, Tesouro, ações, cripto) são **cadastradas
manualmente pelo usuário dentro do Radar**. A Pierre alimenta apenas a parte de contas
bancárias/saldo em caixa.

## Escopo

- Autenticação simples (login único, só para o usuário) protegendo o app antes de
  qualquer dado real ser exposto.
- Integração com a API da Pierre: contas, saldo, transações.
- CRUD de posições de investimento cadastradas manualmente.
- Persistência em banco real (histórico de snapshots), substituindo os fixtures do
  sub-projeto 1.
- Sincronização sob demanda (botão "Atualizar agora"), sem cron automático nesta fase.

## Fora de escopo

- Qualquer ação de escrita na conta bancária (pagamentos, transferências) — Radar é
  read-only sobre dados financeiros do usuário.
- Fluxo de consentimento Open Finance em si — isso já é resolvido pela Pierre (via
  WhatsApp, conforme a doc dela); o Radar só consome a API key já autorizada.
- Categorização de gastos / orçamento — a Pierre já faz isso para o próprio uso dela;
  não é o foco do Radar (que é sobre investimento, não sobre controle de gastos).
- Descoberta de endpoint de investimentos não documentado da Pierre (fica registrado
  como possibilidade a checar durante a implementação, não bloqueia o design).

## Arquitetura

- **Next.js Route Handlers** (`app/api/pierre/*`) como backend-for-frontend: a API key
  da Pierre fica só em variável de ambiente server-side, nunca chega ao client.
- **Banco de dados: MySQL self-hospedado via Docker Compose** — escolhido no lugar de
  um serviço gerenciado (Postgres/MySQL na nuvem) porque o usuário já tem domínio de
  MySQL e quer rodá-lo ele mesmo. Cobre bem o desenvolvimento local. Para produção, se
  o front-end for publicado (ex.: Vercel), o MySQL precisa estar em algum host acessível
  pela rede (VPS próprio, por exemplo) — decisão de hospedagem de produção fica para a
  implementação, não bloqueia este design.
- **Autenticação:** Auth.js (NextAuth) com credentials provider — único usuário
  permitido definido via variável de ambiente (email/hash de senha). Sessão em cookie
  httpOnly. Sem cadastro de novos usuários, sem recuperação de senha self-service (é
  uso pessoal).
- **Sincronização:** botão "Atualizar agora" no front-end dispara uma rota que chama
  `Manual Update` da Pierre, busca accounts/balances/transactions atualizados, e grava
  um novo snapshot no banco. Sem cron nesta fase — o histórico cresce a cada clique,
  não em intervalos fixos.

## Modelo de dados (novas tabelas)

- `bank_account { id, institution, external_id (Pierre), type, balance, last_synced_at }`
- `bank_transaction { id, account_id, external_id, amount, description, category, occurred_at }`
- `investment_position { id, asset_class ('rendaFixa'|'cripto'|'acoes'), name, quantity, unit_value, contracted_rate, maturity_date, purchased_at, notes, updated_at }`
  — cadastro manual, CRUD completo pelo usuário.
- `sync_log { id, source ('pierre'), status, started_at, finished_at, error }`
  — auditoria simples de cada sincronização.

## Fluxo de sincronização

1. Usuário clica "Atualizar agora" na Visão Geral.
2. Route handler chama `Manual Update` da Pierre, depois `Get Accounts` +
   `Get Balance` + `Get Transactions` (janela desde o último sync).
3. Grava/atualiza `bank_account`, insere novas `bank_transaction`, registra
   `sync_log`.
4. Front-end revalida a página (Server Component busca do banco, não da Pierre
   diretamente — a Pierre só é chamada dentro da rota de sync).

As posições de investimento (`investment_position`) não têm "sync" — são editadas
diretamente pelo usuário numa tela de cadastro (criar/editar/excluir).

## Tratamento de erro

- Falha na chamada à Pierre (token inválido, banco temporariamente fora do ar): grava
  `sync_log` com status de erro e mensagem, front-end mostra a última sincronização
  bem-sucedida com um aviso ("Última atualização: há 3 dias — a última tentativa
  falhou"), nunca quebra a tela mostrando dado zerado.

## Testes

- Unitários: parsing/normalização da resposta da Pierre para os tipos internos;
  cálculo de saldo consolidado a partir de múltiplas contas.
- Integração: rota de sync com a API da Pierre mockada (contrato conhecido via docs),
  cobrindo o caminho de sucesso e o de falha parcial (uma conta falha, outras não).
- CRUD de `investment_position`: validação de campos, isolamento (é um usuário só, mas
  ainda assim a sessão precisa estar autenticada para qualquer rota).
