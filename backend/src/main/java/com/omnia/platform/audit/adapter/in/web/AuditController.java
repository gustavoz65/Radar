package com.omnia.platform.audit.adapter.in.web;

import com.omnia.platform.audit.application.usecase.AuditService;
import com.omnia.platform.audit.domain.model.AuditEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit", description = "Append-only audit trail (LGPD)")
class AuditController {

    private final AuditService audit;

    AuditController(AuditService audit) {
        this.audit = audit;
    }

    @GetMapping
    @Operation(summary = "Recent audit events for the current tenant")
    List<AuditEventResponse> recent() {
        return audit.recent(100).stream().map(AuditEventResponse::from).toList();
    }

    record AuditEventResponse(
            UUID id,
            UUID actorUserId,
            String action,
            String entityType,
            UUID entityId,
            String summary,
            Instant occurredAt) {

        static AuditEventResponse from(AuditEvent e) {
            return new AuditEventResponse(
                    e.getId(),
                    e.getActorUserId(),
                    e.getAction(),
                    e.getEntityType(),
                    e.getEntityId(),
                    e.getSummary(),
                    e.getOccurredAt());
        }
    }
}
