# Funcionalidades de Inteligência Artificial

> Status: Ativo · Última revisão: 2026-07-19
> Princípio: IA nativa com dados do tenant, nunca vazando dados entre tenants. Toda ação de IA é
> auditada, reversível quando possível, e o humano aprova ações externas (mensagens a clientes) por padrão.

## Arquitetura de IA (resumo)

- **Camada de acesso a modelos**: gateway próprio no backend (porta `AiGateway`) com provedor plugável
  (Anthropic Claude como padrão; ver ADR-009). Orçamento e rate-limit por tenant/plano.
- **Contexto**: RAG sobre dados do tenant (clientes, atendimentos, vendas, financeiro) via consultas
  estruturadas — preferimos _tool use_ sobre embeddings genéricos: o modelo chama ferramentas internas
  ("buscar_faturamento(período)") em vez de receber dumps de dados.
- **Privacidade**: prompts não contêm dados de outros tenants; PII minimizada; logs de IA auditáveis;
  opt-out por tenant.

## Funcionalidades (por fase)

### Fase 2 — Assistente e produtividade

1. **Assistente do negócio (chat)**: responde perguntas operacionais ("quanto faturei em maio?",
   "quem faltou esta semana?", "quais clientes estão sumidos?") via tool use sobre relatórios.
2. **Resumo de cliente**: um parágrafo no topo da ficha — histórico, preferências, pendências,
   última visita, risco de churn.
3. **Geração de mensagens**: redigir confirmação, cobrança amigável, campanha de retorno, resposta
   a avaliação — no tom da marca do tenant (configurável), sempre com revisão humana antes do envio.

### Fase 3 — Previsão e automação inteligente

4. **Previsão de no-show**: score por agendamento (histórico do cliente, antecedência, dia/horário);
   ação sugerida: confirmação extra ou overbooking controlado.
5. **Risco de churn de cliente**: classificação por recência/frequência/valor + sinais; alimenta
   segmento automático "em risco" para campanhas.
6. **Previsão de fluxo de caixa**: projeção de 30/60/90 dias com sazonalidade; alerta de aperto de caixa.
7. **Classificação automática**: categorizar despesas por descrição; taguear clientes; triagem de leads.
8. **Detecção de oportunidades**: "clientes que compraram X e nunca fizeram Y", horários ociosos com
   sugestão de promoção relâmpago; itens de estoque parados.

### Fase 4 — Agentes

9. **Agente de agenda** (WhatsApp): cliente final agenda/remarca conversando; agente consulta
   disponibilidade e confirma, dentro de regras do tenant.
10. **Agente de cobrança**: régua conversacional para inadimplentes, com escalonamento a humano.
11. **Insights semanais**: resumo executivo automático toda segunda ("sua semana: ocupação 78% (+5pp),
    3 clientes em risco, caixa projetado ok"), por e-mail/WhatsApp do dono.
12. **Análise de desempenho**: comparativo entre profissionais/unidades com recomendações.

## Guardrails

- Ações externas (enviar mensagem, conceder desconto) exigem aprovação humana até o tenant habilitar
  autonomia explícita por automação.
- Citações: respostas numéricas do assistente linkam o relatório de origem.
- Fallback determinístico: se IA indisponível, tudo funciona sem ela (IA é camada, não dependência).
- Medição: toda feature de IA tem métrica de aceite (ex.: % de mensagens geradas enviadas sem edição).
