package com.omnia.platform.audit;

import java.util.UUID;

/** Public API to append an audit entry. Tenant comes from the current context. */
public interface AuditTrail {

    void record(UUID actorUserId, String action, String entityType, UUID entityId, String summary);
}
