-- Webhooks de saída (módulo integration). DATABASE.md §3.

CREATE TABLE webhook_subscriptions (
    id          UUID PRIMARY KEY,
    tenant_id   UUID         NOT NULL REFERENCES tenants (id),
    event_type  VARCHAR(60)  NOT NULL,
    url         VARCHAR(500) NOT NULL,
    secret      VARCHAR(80)  NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version     BIGINT       NOT NULL DEFAULT 0
);
CREATE INDEX webhook_subscriptions_tenant_event_idx ON webhook_subscriptions (tenant_id, event_type);

ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON webhook_subscriptions
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
