# Requisitos por Módulo

> Levantamento de requisitos funcionais. Cada módulo indica: objetivo, requisitos essenciais (MUST),
> importantes (SHOULD) e diferenciais (COULD), além da fase do roadmap em que entra.
> Status: Ativo · Última revisão: 2026-07-19

Convenções: RF = requisito funcional. Priorização MoSCoW. Fases definidas no [ROADMAP.md](./ROADMAP.md).

## Núcleo da plataforma

### 1. Tenancy & Onboarding (Fase 0)

- MUST: criação de tenant self-service; escolha de vertical (aplica preset de módulos, terminologia, funis e campos); subdomínio próprio (`empresa.omnia.app`, estrutura preparada); plano e trial.
- MUST: isolamento total de dados por tenant (ver ADR-003); configurações por tenant.
- SHOULD: tour guiado, dados de exemplo descartáveis, checklist de ativação.
- COULD: migração assistida (importar planilha/concorrente) com mapeamento por IA.

### 2. Identidade, Papéis e Permissões (Fase 0)

- MUST: login e-mail/senha (Argon2), JWT access+refresh, logout global; convite de usuários por e-mail; papéis padrão (Proprietário, Administrador, Atendente, Profissional, Financeiro, Leitura) e papéis personalizados; permissões por módulo+ação (RBAC), escopo "somente meus registros" para profissionais.
- SHOULD: OAuth2 social (Google), 2FA TOTP, política de senha, sessão por dispositivo.
- COULD: SSO SAML/OIDC para planos enterprise; ABAC (atributos) para regras finas.

### 3. Configurações & Personalização (Fase 1)

- MUST: identidade visual (logo, cores primária/secundária, tema claro/escuro padrão); nome, dados da empresa, horários de funcionamento, feriados; módulos habilitados por tenant; terminologia por vertical (cliente/paciente/aluno/tutor).
- MUST: campos personalizados (texto, número, data, seleção, multi-seleção, booleano, arquivo) em Clientes, Atendimentos, Vendas e OS, com validação e ordenação.
- SHOULD: menus/dashboard configuráveis (widgets por papel); status e etapas personalizados por fluxo; formulários públicos personalizados.
- COULD: editor visual de fluxos; white-label completo (domínio próprio).

### 4. Auditoria, Logs e LGPD (Fase 1)

- MUST: trilha de auditoria imutável (quem, o quê, quando, antes/depois) para entidades sensíveis; registro de consentimento; exportação e anonimização de dados de um cliente (direitos do titular).
- SHOULD: retenção configurável; log de acessos; relatório LGPD.

### 5. Notificações (Fase 1)

- MUST: centro de notificações in-app; e-mail transacional (convites, lembretes, cobranças); templates por tenant com variáveis.
- SHOULD: WhatsApp (provedor oficial, arquitetura de canal plugável), SMS; preferências por usuário; agendamento e fila com retry.
- COULD: push mobile/web.

## Módulos de operação

### 6. Clientes (CRM base) (Fase 1)

- MUST: cadastro completo (PF/PJ), múltiplos contatos, endereços, tags, campos personalizados; linha do tempo unificada (atendimentos, vendas, pagamentos, mensagens, notas, arquivos); busca instantânea; listas com filtros salvos (visões); dependentes/vínculos (pet→tutor, aluno→responsável, veículo→dono).
- SHOULD: mesclar duplicados; segmentação dinâmica (ex.: "sumidos há 60 dias"); score de engajamento.
- COULD: enriquecimento automático; carteira de clientes por profissional.

### 7. Leads & Funil (Fase 2)

- MUST: captura (formulário público, manual, importação), funis kanban personalizáveis, etapas com probabilidade, motivo de ganho/perda, conversão lead→cliente.
- SHOULD: distribuição automática (round-robin), SLA de primeiro contato, atividades e follow-ups.
- COULD: lead scoring por IA; captura via WhatsApp/Instagram.

### 8. Agenda & Agendamentos (Fase 1 — carro-chefe)

- MUST: agenda por profissional e por recurso (sala, cadeira, box, equipamento); visões dia/semana/mês; criação rápida (<5 cliques), remarcar por drag-and-drop; serviços com duração e preço; bloqueios, intervalos, horários por profissional; status do atendimento (agendado→confirmado→em atendimento→concluído→faturado / no-show / cancelado); lembretes automáticos (e-mail; WhatsApp quando canal ativo).
- MUST: agendamento online público (página do tenant) com confirmação automática ou aprovação.
- SHOULD: recorrência; lista de espera; overbooking controlado; check-in; comissão vinculada ao serviço executado.
- COULD: previsão de no-show por IA com sugestão de overbooking; otimização de agenda.

### 9. Vendas, Orçamentos e Comandas (Fase 2)

- MUST: venda rápida (balcão/comanda) de serviços e produtos; orçamentos com validade, aprovação e conversão em venda/OS; descontos com alçada; múltiplas formas de pagamento na mesma venda.
- SHOULD: pacotes e sessões (ex.: 10 sessões de massagem, controle de saldo); vale-presente; tabela de preços por canal.
- COULD: PDV offline-first; TEF/maquininha integrada.

### 10. Ordens de Serviço (Fase 3 — oficinas/assistências)

- MUST: OS com itens (peças+serviços), status personalizáveis, responsável, prazos; checklist de entrada (fotos, laudo), assinatura de aprovação; vínculo com veículo/equipamento do cliente.
- SHOULD: portal do cliente para acompanhar OS; garantia; termos por template.

### 11. Financeiro & Fluxo de Caixa (Fase 2)

- MUST: contas a pagar/receber, categorias (plano de contas simplificado), centros de custo; fluxo de caixa diário/mensal projetado vs realizado; conciliação manual; caixa (abertura/fechamento/sangria) por ponto de atendimento; comissões por profissional (regras por serviço/produto/%); recorrência (mensalidades/planos) com geração automática de cobranças.
- SHOULD: boleto/Pix via gateway (arquitetura de provedor plugável — Stripe/Pagar.me/Asaas), régua de cobrança automática, conciliação bancária (OFX), DRE simplificada.
- COULD: antecipação de recebíveis; open finance.

### 12. Catálogo: Produtos & Serviços (Fase 1)

- MUST: serviços (duração, preço, comissão, recursos exigidos); produtos (SKU, código de barras, preço, custo, margem, unidade); categorias; fotos.
- SHOULD: variações (tamanho/cor); composição (kit); tabela por vertical (ex.: porte do pet altera preço).

### 13. Estoque & Compras (Fase 3)

- MUST: saldo por depósito, movimentações (entrada, saída, ajuste, transferência) sempre com origem documentada; baixa automática por venda/OS; estoque mínimo com alerta.
- SHOULD: fornecedores, pedidos de compra, recebimento parcial, custo médio; inventário com contagem.
- COULD: sugestão de compra por IA (consumo + sazonalidade).

### 14. Relatórios, Dashboards & Analytics (Fase 2)

- MUST: dashboard inicial por papel (dono vê caixa+agenda+vendas; atendente vê agenda do dia); relatórios essenciais: faturamento, serviços mais vendidos, desempenho por profissional, taxa de ocupação da agenda, no-show, novos clientes, churn de clientes, comissões, DRE simplificada; exportação CSV/Excel/PDF.
- SHOULD: widgets configuráveis; comparativos período a período; metas.
- COULD: perguntas em linguagem natural ("qual foi meu faturamento em maio?") — ver AI-FEATURES.

### 15. Marketing & Fidelização (Fase 3)

- MUST: campanhas por segmento (e-mail; WhatsApp quando ativo): aniversário, retorno, pós-atendimento; NPS/avaliação pós-atendimento.
- SHOULD: programa de pontos/fidelidade; cupons; indicação (member-get-member).

### 16. Automações & Workflows (Fase 3)

- MUST: motor gatilho→condições→ações (ex.: "atendimento concluído → enviar pesquisa em 2h"; "cliente sem visita há 60 dias → campanha de retorno"); biblioteca de receitas prontas por vertical; log de execução.
- SHOULD: builder visual; delays, ramificações; limites por plano.

### 17. Tarefas, Kanban & Calendário interno (Fase 3)

- MUST: tarefas com responsável, prazo, vínculo a cliente/venda/OS; quadro kanban por equipe.
- SHOULD: comentários com menções; lembretes.

### 18. Documentos, Anexos & Assinaturas (Fase 3)

- MUST: upload de arquivos vinculados (cliente, atendimento, OS, venda) com limites por plano; templates de documentos com variáveis (contratos, termos, anamnese).
- SHOULD: assinatura eletrônica simples (aceite com trilha de auditoria); COULD: integração com provedores qualificados (ICP-Brasil).

### 19. Chat interno (Fase 4)

- SHOULD: conversas por equipe e menções vinculadas a registros. (Baixa prioridade — não competir com Slack/WhatsApp.)

### 20. Integrações, API pública & Webhooks (Fase 3)

- MUST: API REST pública versionada com API keys por tenant e escopos; webhooks assinados (eventos de cliente, agenda, venda, pagamento) com retries e DLQ.
- SHOULD: integrações nativas: Google Calendar, gateways de pagamento, WhatsApp Business API, emissores fiscais (NFS-e); importação/exportação CSV com mapeamento.
- COULD: marketplace de integrações; Zapier/Make.

### 21. Administração da Plataforma (interna) (Fase 2)

- MUST: console interno: tenants, planos, billing da assinatura, feature flags por tenant/plano, suporte (login-as com consentimento e auditoria), métricas de saúde (ativação, churn, MRR).
- SHOULD: gestão de versões de preset por vertical.

## Matriz módulo × vertical (presets)

| Módulo           | Barbearia/Salão | Clínica      | Academia      | Petshop       | Oficina     | Imobiliária/Serviços |
| ---------------- | --------------- | ------------ | ------------- | ------------- | ----------- | -------------------- |
| Agenda           | ●               | ●            | ● (aulas)     | ●             | ○           | ○                    |
| Clientes         | ●               | ● (paciente) | ● (aluno)     | ● (pet/tutor) | ● (veículo) | ●                    |
| Vendas/Comanda   | ●               | ●            | ○             | ●             | ●           | ○                    |
| Recorrência      | ○               | ○            | ●             | ○             | ○           | ●                    |
| OS               | —               | —            | —             | ○             | ●           | ○                    |
| Estoque          | ●               | ●            | ○             | ●             | ●           | —                    |
| Funil/Leads      | ○               | ○            | ●             | ○             | ○           | ●                    |
| Prontuário/Ficha | ○               | ●            | ● (avaliação) | ●             | ● (laudo)   | —                    |

● habilitado no preset · ○ opcional · — não se aplica

## Requisitos não-funcionais (resumo — detalhes em ARCHITECTURE.md)

- Disponibilidade alvo 99,9%; RPO ≤ 1h, RTO ≤ 4h.
- p95 de API < 300 ms; interações de UI < 100 ms percebidos.
- LGPD by design; criptografia em trânsito e em repouso; segredos fora do código.
- Escala: 10.000 tenants / 500 usuários simultâneos por instância sem re-arquitetura (ver ADR-003).
- Observabilidade: logs estruturados com `tenant_id`, métricas, tracing.
- i18n preparado (pt-BR primeiro; en/es depois). Fuso horário por tenant.
