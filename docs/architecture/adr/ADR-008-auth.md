# ADR-008 — Autenticação JWT + refresh rotativo; usuário por tenant; RBAC

- Status: Aceito · Data: 2026-07-19

## Decisão

1. **Access token JWT** (15 min) com claims `sub`, `tenant_id`, `roles`; assinado RS256 (chave rotacionável).
2. **Refresh token opaco rotativo** (30 dias) em cookie httpOnly+Secure+SameSite=Lax, persistido com
   hash no banco; reuso de token revogado invalida a família (detecção de roubo).
3. **Usuário pertence a um tenant** (e-mail único por tenant, não global) na v1. Quem trabalha em
   duas empresas tem duas contas. Reavaliar identidade global se multi-empresa virar demanda real.
4. **RBAC**: permissões `module:action` agregadas em papéis; papéis padrão seedados por vertical +
   papéis personalizados por tenant; escopo adicional "somente meus registros" para profissionais.
   ABAC fica para necessidade concreta.
5. Senhas com **Argon2id**; OAuth2 social (Google) e 2FA TOTP na Fase 1/2.

## Justificativa

JWT stateless escala horizontalmente e carrega o `tenant_id` que alimenta o RLS (ADR-003) — o token
é a fonte de verdade do tenant, não o subdomínio. Usuário por tenant simplifica RLS, LGPD (dados do
usuário morrem com o tenant) e RBAC.

## Consequências

- (+) Simplicidade e isolamento fortes. (−) Logout imediato de access token exige denylist Redis
  para casos críticos (implementada para suspensão de tenant/usuário).
