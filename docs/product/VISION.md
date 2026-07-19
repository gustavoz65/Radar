# Omnia — Visão de Produto

> Documento de visão. Público-alvo: time de produto, engenharia, stakeholders.
> Status: **Ativo** · Última revisão: 2026-07-19

## 1. O problema

Pequenas e médias empresas de serviços (clínicas, consultórios, barbearias, salões, academias,
petshops, oficinas, restaurantes, imobiliárias, escritórios e prestadores de serviço em geral)
operam hoje com uma colcha de retalhos: agenda no WhatsApp, financeiro em planilha, clientes
num caderno ou num CRM genérico caro demais, estoque em outro sistema. As soluções existentes são:

- **Horizontais demais** (HubSpot, Pipedrive): não falam a língua do segmento, exigem configuração pesada.
- **Verticais demais** (um sistema só para barbearia, outro só para clínica): o fornecedor não escala
  entre segmentos e o cliente fica preso a um produto raso.
- **ERPs tradicionais** (Totvs, Bling, Omie): fortes em fiscal/financeiro, fracos em relacionamento,
  agendamento e experiência de uso.

## 2. A oportunidade

A pesquisa de mercado (ver [MARKET-RESEARCH.md](./MARKET-RESEARCH.md)) mostra que em 2026:

- SaaS vertical cresce ~2x mais rápido que horizontal; mercado de ~US$ 164 bi com CAGR de 11,5%.
- 30–40% do mercado será remodelado por agentes de IA entre 2026–2028.
- Os produtos defensáveis são os que **dominam o processo de ponta a ponta** do negócio do cliente,
  não os que resolvem um único problema.
- Compliance embutido (LGPD, e futuramente requisitos por vertical) é diferencial, não acessório.

## 3. A tese do Omnia

**Uma única plataforma multi-tenant e modular, que se "veste" de sistema vertical para cada segmento.**

O núcleo (clientes, agenda, financeiro, estoque, vendas, automações, IA) é único e compartilhado.
Cada vertical é um **perfil de configuração**: terminologia ("paciente" vs "cliente" vs "aluno"),
módulos habilitados, campos personalizados, fluxos, funis, papéis e tema visual.
Assim entregamos profundidade vertical com custo de plataforma horizontal.

## 4. Segmentos-alvo (ordem de ataque)

| Onda | Segmentos                                           | Racional                                                       |
| ---- | --------------------------------------------------- | -------------------------------------------------------------- |
| 1    | Barbearias, salões, clínicas de estética            | Agendamento + fidelização são a dor nº 1; ciclo de venda curto |
| 2    | Clínicas, consultórios, petshops (banho/tosa + vet) | Mesma mecânica de agenda + prontuário/ficha do cliente         |
| 3    | Academias e studios                                 | Recorrência (mensalidades), controle de acesso, planos         |
| 4    | Oficinas e assistências técnicas                    | Ordens de serviço + orçamentos + estoque de peças              |
| 5    | Imobiliárias, escritórios e serviços B2B            | CRM/funil + contratos + documentos                             |

## 5. Personas

- **Dono do negócio** ("Carla, dona de clínica de estética, 34"): quer ver caixa, agenda cheia e
  clientes voltando. Não tem tempo para configurar software. Mobile-first.
- **Atendente/recepção** ("Jéssica, 24"): vive na agenda e no WhatsApp. Precisa de velocidade
  e zero fricção para marcar, remarcar, cobrar.
- **Profissional executante** (barbeiro, dentista, personal): quer sua agenda, suas comissões
  e a ficha do cliente na mão.
- **Contador/financeiro externo**: acesso restrito a relatórios e exportações.
- **Administrador da plataforma (nós)**: operação SaaS — tenants, planos, billing, suporte, feature flags.

## 6. Proposta de valor

1. **Pronto em minutos**: onboarding guiado escolhe a vertical e liga o pacote certo de módulos.
2. **Tudo em um**: agenda, clientes, vendas, financeiro, estoque, marketing e relatórios.
3. **IA nativa**: assistente que resume clientes, redige mensagens, prevê no-show e inadimplência,
   sugere próximas ações e responde perguntas sobre o negócio ("como foi meu mês?").
4. **A cara da empresa**: logo, cores, subdomínio, campos e fluxos próprios por tenant.
5. **Cresce com o cliente**: módulos ativáveis; do MEI ao multi-filial.

## 7. Modelo de negócio

- Assinatura mensal por plano (Starter / Pro / Business) + add-ons de módulo.
- Precificação híbrida: base por empresa + faixa de usuários + consumo de IA/automizações
  (tendência 2026: preço por resultado/uso, não só por assento).
- Marketplace de integrações no médio prazo (receita de parceiros).

## 8. Métricas norteadoras (North Stars)

- Ativação: % de tenants que agendam ≥10 atendimentos na 1ª semana.
- Retenção líquida de receita (NRR).
- Tempo até o primeiro valor (TTFV) < 15 minutos.
- % de mensagens/cobranças automatizadas (proxy de valor da automação).

## 9. Não-objetivos (por enquanto)

- Emissão fiscal completa (NF-e/NFS-e) — integraremos com emissores via API antes de internalizar.
- Folha de pagamento.
- E-commerce completo (apenas catálogo/agendamento online público).
- Atendimento hospitalar/regulado (TISS etc.) — exige compliance específico; fase futura.

## 10. Documentos relacionados

- [Pesquisa de mercado e concorrentes](./MARKET-RESEARCH.md)
- [Requisitos por módulo](./MODULES.md)
- [Funcionalidades de IA](./AI-FEATURES.md)
- [Roadmap](./ROADMAP.md)
- [Arquitetura](../architecture/ARCHITECTURE.md)
