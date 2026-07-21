package com.omnia.platform.audit.application.usecase;

import com.omnia.platform.audit.AuditTrail;
import com.omnia.platform.audit.application.port.out.AuditEventRepository;
import com.omnia.platform.audit.domain.model.AuditEvent;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService implements AuditTrail {

    private final AuditEventRepository events;

    public AuditService(AuditEventRepository events) {
        this.events = events;
    }

    @Override
    @Transactional
    public void record(UUID actorUserId, String action, String entityType, UUID entityId, String summary) {
        events.save(AuditEvent.of(TenantContext.require(), actorUserId, action, entityType, entityId, summary));
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> recent(int limit) {
        return events.findRecent(limit);
    }
}
