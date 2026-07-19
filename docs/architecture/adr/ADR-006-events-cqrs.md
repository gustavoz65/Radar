# ADR-006 — Eventos de domínio via Modulith; CQRS leve; sem event sourcing

- Status: Aceito · Data: 2026-07-19

## Decisão

1. Integração entre módulos por **eventos de domínio** publicados pelo agregado e entregues com o
   **event publication registry** do Spring Modulith (persistidos na mesma transação; entregues após
   commit; republish de incompletos no restart) — outbox pattern sem broker externo.
2. **CQRS leve**: módulos de leitura pesada (analytics, dashboards, timeline do cliente) mantêm
   projeções denormalizadas atualizadas por eventos. Escrita sempre via agregados.
3. **Sem event sourcing**: estado atual em tabelas relacionais; histórico via auditoria e tabelas
   append-only onde o domínio pede (estoque, financeiro).

## Justificativa

Eventual consistency entre módulos prepara a extração de serviços (ADR-002) e desacopla features
(notificação/comissão/analytics reagem a `AppointmentCompleted` sem o módulo de agenda conhecê-las).
Event sourcing completo custaria caro em modelagem/tooling sem requisito que o exija.

## Consequências

- (+) Baixo acoplamento real; resiliência a falha de listener; migração futura para broker
  (Rabbit/Kafka) trocando o transporte, não o modelo.
- (−) Consistência eventual entre módulos — assumida e comunicada na UX (ex.: comissão aparece segundos depois).
