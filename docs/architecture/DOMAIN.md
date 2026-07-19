# Modelo de Domínio — Omnia

> Status: Ativo · Última revisão: 2026-07-19
> Linguagem ubíqua e agregados por contexto delimitado. Cada entidade tem justificativa.

## 1. Linguagem ubíqua (termos canônicos)

| Termo                 | Definição                                                                        | Sinônimos por vertical (apenas UI)    |
| --------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| **Tenant**            | Empresa cliente da plataforma. Fronteira absoluta de dados.                      | —                                     |
| **Member**            | Usuário pertencente a um tenant, com papéis.                                     | funcionário, profissional             |
| **Customer**          | Pessoa/empresa atendida pelo tenant.                                             | paciente, aluno, tutor                |
| **CustomerAsset**     | Coisa vinculada ao customer que recebe serviço.                                  | pet, veículo, equipamento, dependente |
| **ServiceOffering**   | Serviço vendável com duração e preço.                                            | procedimento, aula                    |
| **Product**           | Item físico vendável com estoque.                                                | —                                     |
| **Appointment**       | Compromisso na agenda: customer + serviço(s) + profissional + recurso + horário. | consulta, sessão, horário             |
| **Resource**          | Capacidade física agendável (sala, cadeira, box, equipamento).                   | —                                     |
| **Sale**              | Transação comercial (itens, pagamentos).                                         | comanda, venda                        |
| **WorkOrder**         | Serviço de execução longa com status e aprovação.                                | OS                                    |
| **Entry** (finance)   | Lançamento financeiro a pagar/receber.                                           | conta                                 |
| **Plan/Subscription** | (billing) Plano da plataforma e assinatura do tenant.                            | —                                     |

Regra: código e banco usam SEMPRE o termo canônico em inglês; a terminologia vertical é camada de
apresentação (dicionário por preset de vertical).

## 2. Contextos delimitados e agregados

### Tenancy (`tenant`)

- **Tenant** (raiz): id, slug/subdomínio, nome, documento, vertical, status (TRIAL/ACTIVE/SUSPENDED/CANCELLED), plano, timezone, locale.
  _Justificativa: raiz de todo isolamento; status controla acesso global._
- **TenantSettings**: branding (logo, cores, tema), horários de funcionamento, terminologia, módulos habilitados.
  _Separado do Tenant: muda com frequência e por atores diferentes; evita agregar concorrência no Tenant._
- **CustomFieldDefinition**: entidade-alvo, tipo, rótulo, obrigatório, opções, ordem.
  _Justificativa: personalização por tenant sem alterar schema (valores em JSONB na entidade-alvo)._

### Identidade (`identity`)

- **User** (raiz): credenciais e perfil. Um humano = um user por tenant (e-mail único por tenant).
  _Optamos por user POR TENANT (não global) na v1: simplifica RLS e LGPD; login federado entre tenants é raro em SMB. ADR-008._
- **Role** (raiz): nome + conjunto de permissões (`module:action`). Papéis padrão são seeds imutáveis; personalizados são do tenant.
- **Invitation**: convite pendente com papel e expiração.
- **RefreshToken**: rotação e revogação de sessões.

### Clientes (`customer`)

- **Customer** (raiz): dados cadastrais, contatos, endereços, tags, campos custom (JSONB), consentimentos.
  _Timeline NÃO é campo do agregado — é projeção de eventos de outros módulos (baixo acoplamento)._
- **CustomerAsset**: pertence a um Customer; tipo definido pela vertical (pet, veículo...). Campos custom JSONB.
  _Entidade própria (não JSONB) porque é agendável e referenciada por Appointment/WorkOrder._

### Catálogo (`catalog`)

- **ServiceOffering** (raiz): duração, preço, comissão default, recursos exigidos, buffer pré/pós.
- **Product** (raiz): SKU, preços, custo, unidade, controle de estoque on/off.
- **Category**: árvore rasa (1 nível) para ambos.
  _Serviço ≠ Produto como agregados distintos: ciclos de vida, invariantes e módulos consumidores diferentes (agenda vs estoque)._

### Agenda (`scheduling`)

- **Appointment** (raiz): customer (+asset opcional), itens de serviço, profissional, recurso, início/fim, status com máquina de estados
  (SCHEDULED→CONFIRMED→IN_PROGRESS→COMPLETED→BILLED; CANCELLED, NO_SHOW), origem (interno/online).
  _Invariantes: sem sobreposição por profissional/recurso (exceto overbooking explícito); transições válidas._
- **ScheduleRule**: disponibilidade por profissional/recurso (dias, faixas, exceções, bloqueios).
- **Resource** (raiz): capacidade física agendável.
  Eventos: `AppointmentScheduled/Confirmed/Completed/Cancelled/NoShowMarked` — consumidos por notification, finance (comissão), analytics, automation.

### Vendas (`sales`) — Fase 2

- **Sale** (raiz): itens (produto/serviço/pacote), descontos com alçada, pagamentos, status (OPEN→PAID→/CANCELLED/REFUNDED).
- **Quote** (raiz): orçamento com validade; converte em Sale/WorkOrder.
- **PackagePurchase**: saldo de sessões compradas.
  Evento `SaleCompleted` → finance (receita), inventory (baixa), analytics.

### Financeiro (`finance`) — Fase 2

- **Entry** (raiz): lançamento a pagar/receber; categoria, centro de custo, vencimento, parcelas, status.
- **CashSession** (raiz): abertura/fechamento de caixa com conferência.
- **CommissionRule / CommissionEntry**: regra e apuração por profissional.
- **RecurringCharge**: recorrência que gera Entries.
  _Finance NUNCA referencia Sale por FK direta entre módulos: guarda `source_type/source_id` (referência fraca) — permite extração futura._

### Demais contextos

- `notification`: **NotificationTemplate**, **NotificationDispatch** (canal, status, retries).
- `audit`: **AuditEvent** (append-only, sem update/delete).
- `workorder`: **WorkOrder** (raiz) com itens, checklist, aprovação, vínculo a CustomerAsset.
- `inventory`: **StockItem** (saldo por depósito), **StockMovement** (append-only, saldo é derivado), **Supplier**, **PurchaseOrder**.
- `crm`: **Lead** (raiz), **Pipeline/Stage** (config), **Activity**.
- `billing`: **PlatformPlan**, **PlatformSubscription** — dados **globais** (sem tenant_id): são NOSSOS dados sobre tenants.
- `automation`: **AutomationRule** (gatilho, condições, ações), **AutomationRun** (log).
- `ai`: **AiConversation**, **AiActionLog** (auditoria de IA).

## 3. Regras de relacionamento entre módulos

1. Referência dentro do módulo: FK forte.
2. Referência entre módulos: **id fraco + tipo** (`source_type`, `source_id`) ou consulta via API pública do módulo.
3. Consistência entre módulos: eventual, por eventos de domínio (após commit). Ex.: comissão gerada por `AppointmentCompleted`.
4. Toda raiz de agregado tem `tenant_id`; agregados nunca cruzam tenants (invariante global, garantida por RLS).
5. IDs: UUIDv7 (ordenáveis por tempo — índices B-tree amigáveis).

## 4. Máquinas de estado principais

```
Appointment: SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED → BILLED
                 │            │            │
                 └────────────┴────────────┴──► CANCELLED
                 └──► NO_SHOW (a partir de SCHEDULED/CONFIRMED)

Sale: OPEN → PAID → REFUNDED        Tenant: TRIAL → ACTIVE ⇄ SUSPENDED → CANCELLED
        └──► CANCELLED
```

Transições são métodos do agregado (não setters); transição inválida lança `DomainException`.
