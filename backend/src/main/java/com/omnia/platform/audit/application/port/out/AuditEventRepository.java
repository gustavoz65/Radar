package com.omnia.platform.audit.application.port.out;

import com.omnia.platform.audit.domain.model.AuditEvent;
import java.util.List;

public interface AuditEventRepository {

    AuditEvent save(AuditEvent event);

    List<AuditEvent> findRecent(int limit);
}
