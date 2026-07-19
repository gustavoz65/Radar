# Roadmap

> Status: Ativo · Última revisão: 2026-07-19
> Fases de produto. Cada fase termina com software em produção, testado e documentado.

## Fase 0 — Fundação (em andamento)

Infraestrutura de engenharia e núcleo invisível ao usuário final.

- [x] Pesquisa de mercado, visão e requisitos
- [x] Documentação de arquitetura e ADRs iniciais
- [x] Ambiente de desenvolvimento completo (Git, hooks, Docker, CI, qualidade)
- [x] Esqueleto do monólito modular (Spring Modulith) e do frontend Angular
- [ ] Multi-tenancy ponta a ponta (resolução de tenant, RLS, testes de isolamento)
- [ ] Identidade: registro de tenant, login JWT, refresh, RBAC base
- [ ] Pipeline CI com build, testes, lint e análise estática

## Fase 1 — Operação essencial (alvo: +3 meses)

O mínimo vendável para a Onda 1 (barbearias/salões/estética).

- Onboarding por vertical (presets) · Configurações e identidade visual
- Clientes (ficha completa, timeline, campos personalizados, visões)
- Catálogo de serviços/produtos · Agenda completa + agendamento online público
- Notificações (in-app + e-mail; canal WhatsApp plugável)
- Auditoria e LGPD base · Dashboard inicial simples

## Fase 2 — Dinheiro e inteligência (alvo: +6 meses)

- Vendas/comandas e orçamentos · Financeiro completo + caixa + comissões
- Recorrência e cobranças (gateway plugável)
- Relatórios e dashboards por papel · Console administrativo da plataforma
- IA: assistente do negócio, resumo de cliente, geração de mensagens
- Billing da própria plataforma (assinaturas Omnia)

## Fase 3 — Profundidade vertical e automação (alvo: +12 meses)

- Ordens de Serviço (oficinas) · Estoque e compras · Prontuário/fichas por vertical
- Leads e funil completo · Marketing e fidelização · Automações (motor de workflows)
- API pública + webhooks + integrações (Google Calendar, NFS-e, gateways)
- IA: previsões (no-show, churn, caixa), classificação, oportunidades
- Tarefas/kanban · Documentos e assinatura simples

## Fase 4 — Plataforma e escala (alvo: +18 meses)

- Agentes de IA (agenda e cobrança via WhatsApp) · Insights automáticos
- Marketplace de integrações · White-label/domínio próprio · Multi-filial avançado
- SSO enterprise · Novas verticais (restaurantes, imobiliárias)
- Avaliação de extração de microservices onde houver pressão real de escala (ver ADR-002)

## Critérios de mudança de fase

1. Métricas de ativação/retensão da fase anterior atingidas.
2. Dívida técnica sob controle (cobertura ≥ 80% no domínio, zero issues críticos no Sonar).
3. Documentação e runbooks atualizados.
