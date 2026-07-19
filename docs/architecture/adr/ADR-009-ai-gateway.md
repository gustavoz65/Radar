# ADR-009 — Gateway de IA próprio com provedor plugável

- Status: Aceito · Data: 2026-07-19

## Decisão

Todo acesso a LLMs passa pelo módulo `ai` através da porta `AiGatewayPort`:

- Provedor default: Anthropic Claude (API oficial); interface permite trocar/rotear por feature.
- **Tool use sobre dados estruturados** (o modelo chama ferramentas internas tenant-scoped) em vez de
  despejar dados no prompt; RAG com embeddings só onde texto livre domina (notas, documentos).
- Orçamento por tenant/plano (tokens/mês) com medição por request; rate limit; cache de respostas idempotentes.
- Auditoria: toda chamada registra feature, usuário, tenant, custo; ações externas sugeridas por IA
  exigem aprovação humana por padrão (guardrails em AI-FEATURES.md).
- Nenhum dado de um tenant entra em contexto de outro; PII minimizada no prompt.

## Justificativa

Desacopla o produto de um fornecedor, centraliza custo/segurança/observabilidade e torna IA uma
camada opcional (fallback determinístico obrigatório — ADR alinhado à estratégia "IA nativa" da visão).

## Consequências

- (+) Controle de custo e privacidade; troca de modelo sem tocar features.
- (−) Camada extra a manter; latência do gateway monitorada.
