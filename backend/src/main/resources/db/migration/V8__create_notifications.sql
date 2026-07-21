-- Notificações in-app (módulo notification). DATABASE.md §3.

CREATE TABLE notifications (
    id                 UUID PRIMARY KEY,
    tenant_id          UUID         NOT NULL REFERENCES tenants (id),
    recipient_user_id  UUID         NOT NULL,
    title              VARCHAR(160) NOT NULL,
    body               VARCHAR(500) NOT NULL,
    read               BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX notifications_tenant_recipient_created_idx
    ON notifications (tenant_id, recipient_user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notifications
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
