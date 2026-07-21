package com.omnia.platform.audit.adapter.out.persistence;

import com.omnia.platform.audit.application.port.out.AuditEventRepository;
import com.omnia.platform.audit.domain.model.AuditEvent;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventJpaRepository extends AuditEventRepository, JpaRepository<AuditEvent, UUID> {

    List<AuditEvent> findByTenantIdOrderByOccurredAtDesc(UUID tenantId, Limit limit);

    @Override
    default List<AuditEvent> findRecent(int limit) {
        return findByTenantIdOrderByOccurredAtDesc(TenantContext.require(), Limit.of(limit));
    }
}
