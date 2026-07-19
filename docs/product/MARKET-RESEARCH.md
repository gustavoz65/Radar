# Pesquisa de Mercado e Análise Competitiva

> Status: Ativo · Última revisão: 2026-07-19

## 1. Tendências de SaaS em 2026 (síntese da pesquisa)

1. **Vertical > Horizontal**: SaaS vertical cresce ~2x mais que horizontal; mercado de ~US$164 bi
   (CAGR 11,5%). Vencem os produtos que dominam o processo de ponta a ponta do cliente.
2. **IA nativa, não IA enxertada**: a barra de 2026 é _agente_ — pesquisa, age e itera — e não
   apenas "botão de resumo". 30–40% do mercado vertical deve ser remodelado por agentes até 2028.
3. **Dados como produto**: o valor da IA é limitado pela qualidade dos dados do tenant; o design
   do banco e da telemetria é decisão de produto, não só de engenharia.
4. **Compliance embutido**: LGPD por padrão (auditoria, consentimento, retenção, anonimização).
5. **Precificação híbrida**: pressão sobre preço por assento; modelos por uso/resultado crescem.
6. **Multi-tenancy pool + RLS**: consenso técnico para B2B SMB — schema compartilhado com
   `tenant_id`, Row-Level Security como defesa em profundidade, e trilha de escala
   (réplicas → particionamento → isolar tenants enterprise → shard por último). Redução de 3–5x em COGS.

Fontes principais: ver seção 5.

## 2. Concorrentes diretos e indiretos

### Horizontais (CRM/gestão)

| Produto        | Forças                                        | Fraquezas exploráveis                          |
| -------------- | --------------------------------------------- | ---------------------------------------------- |
| HubSpot        | UX referência, ecossistema, automações        | Caro, genérico, complexo para SMB brasileiro   |
| Pipedrive      | Funil simples e bom                           | Só vendas; sem agenda/financeiro/estoque       |
| Monday/ClickUp | Flexibilidade, quadros                        | "Faça você mesmo"; sem domínio de negócio      |
| Attio          | CRM moderno orientado a dados, UI Linear-like | Foco em startups B2B; sem operação de serviços |

### ERPs SMB Brasil

| Produto    | Forças                        | Fraquezas exploráveis                   |
| ---------- | ----------------------------- | --------------------------------------- |
| Omie       | Financeiro + fiscal fortes    | UX datada; relacionamento/agenda fracos |
| Bling      | Preço, integrações e-commerce | Não atende serviços/agendamento         |
| Conta Azul | Contabilidade integrada       | Pouca profundidade vertical             |
| Totvs      | Enterprise, fiscal completo   | Pesado e caro para SMB                  |

### Verticais (referência de profundidade)

| Segmento        | Players                                | O que copiar                         | O que superar                                          |
| --------------- | -------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| Barbearia/Salão | AppBarber/AvecBeauty, Booksy, Fresha   | Agenda online, comissões, fidelidade | Financeiro raso, sem CRM real, lock-in                 |
| Clínicas        | iClinic, Doctoralia/TuoTempo, Amplimed | Prontuário, confirmação por WhatsApp | Multi-vertical impossível; preço por profissional alto |
| Academias       | Tecnofit, EVO (W12)                    | Recorrência, catraca, treinos        | UX; módulos financeiros limitados                      |
| Petshop         | Simples Vet, Petlove SaaS              | Ficha do pet, banho/tosa             | Integração comercial fraca                             |
| Oficinas        | AutoConta, Oficina Integrada           | OS, orçamento, peças                 | UX datada, sem automação                               |
| Restaurantes    | Goomer, Consumer, iFood suite          | Cardápio/pedido                      | Fora do foco inicial (usaremos módulo básico)          |

### Conclusões competitivas

- Nenhum player brasileiro combina **profundidade vertical multi-segmento + IA nativa + UX moderna**.
- A régua de UX vem de fora do segmento: Linear, Notion, Stripe Dashboard, Attio, Vercel.
- WhatsApp é o canal operacional do Brasil — confirmação, cobrança e marketing têm de ser nativos
  (via provedores oficiais da API do WhatsApp Business).

## 3. Referências de UX/UI adotadas

| Referência       | O que adotamos                                                                 |
| ---------------- | ------------------------------------------------------------------------------ |
| Linear           | Velocidade percebida, command palette (Ctrl+K), densidade equilibrada, atalhos |
| Notion           | Flexibilidade de campos/visões; simplicidade progressiva                       |
| Stripe Dashboard | Clareza de dados financeiros, tabelas, estados vazios exemplares               |
| Attio            | CRM data-first, listas com visões salvas, painéis de registro                  |
| HubSpot          | Modelo mental de CRM (objetos, pipelines, atividades)                          |
| Vercel/GitHub    | Tema dark/light impecável, configurações organizadas                           |
| Raycast          | Ações rápidas, extensibilidade                                                 |

Diretrizes derivadas: dark/light mode desde o dia 1; navegação lateral colapsável por módulo;
command palette global; tabelas virtuais rápidas; estados vazios que ensinam; mobile-first
para agenda e caixa.

## 4. Riscos de mercado

- **Custo de aquisição** em SMB é alto → onboarding self-service impecável e product-led growth.
- **Churn de SMB** (~empresas fecham) → contratos mensais, valor percebido rápido, dados que prendem
  (histórico de cliente é o ativo).
- **Plataformas de canal** (iFood, Doctoralia) verticalizando → diferencial multi-vertical + posse do dado.

## 5. Fontes

- [Vertical AI Agents 2026 (ACTGSYS)](https://actgsys.com/en/blog/vertical-ai-agents-industry-specific-2026)
- [SaaS 2026 Trends (ARDAS)](https://ardas-it.com/saas-2026-trends-from-ai-experiments-to-production-ready-platforms)
- [Why Vertical SaaS Is Outperforming Horizontal (SaaS Mag)](https://www.saasmag.com/vertical-saas-outperforming-horizontal-2026/)
- [Multi-tenant data isolation with PostgreSQL RLS (AWS)](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Multi-tenant SaaS on Postgres (ClickHouse Engineering)](https://clickhouse.com/resources/engineering/multi-tenant-saas-postgres-architecture)
- [Shipping multi-tenant SaaS using Postgres RLS (Nile)](https://www.thenile.dev/blog/multi-tenant-rls)
- [Multi-Tenant SaaS Architecture 2026 (CodeMiners)](https://codeminer.co/blog/multi-tenant-saas-architecture-2026)
