package com.omnia.platform.crm.adapter.in.web;

import com.omnia.platform.crm.application.usecase.CrmUseCases;
import com.omnia.platform.crm.domain.model.Lead;
import com.omnia.platform.crm.domain.model.LeadStage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/leads")
@Tag(name = "Leads", description = "CRM funnel")
class LeadController {

    private final CrmUseCases useCases;

    LeadController(CrmUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping
    @Operation(summary = "List all leads (for the kanban board)")
    List<LeadResponse> list() {
        return useCases.list().stream().map(LeadResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Capture a lead")
    LeadResponse capture(@RequestBody @Valid CaptureRequest request) {
        return LeadResponse.from(
                useCases.capture(request.name(), request.contact(), request.source(), request.notes()));
    }

    @PostMapping("/{id}/stage")
    @Operation(summary = "Move a lead to a stage (NEW/CONTACTED/QUALIFIED/WON)")
    LeadResponse move(@PathVariable UUID id, @RequestBody @Valid MoveRequest request) {
        return LeadResponse.from(useCases.move(id, request.stage()));
    }

    @PostMapping("/{id}/lost")
    @Operation(summary = "Mark a lead as lost")
    LeadResponse lost(@PathVariable UUID id, @RequestBody LostRequest request) {
        return LeadResponse.from(useCases.markLost(id, request == null ? null : request.reason()));
    }

    record CaptureRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 160) String contact,
            @Size(max = 60) String source,
            @Size(max = 500) String notes) {}

    record MoveRequest(@NotNull LeadStage stage) {}

    record LostRequest(@Size(max = 200) String reason) {}

    record LeadResponse(
            UUID id,
            String name,
            String contact,
            String source,
            String notes,
            String stage,
            String lostReason,
            Instant createdAt) {

        static LeadResponse from(Lead lead) {
            return new LeadResponse(
                    lead.getId(),
                    lead.getName(),
                    lead.getContact(),
                    lead.getSource(),
                    lead.getNotes(),
                    lead.getStage().name(),
                    lead.getLostReason(),
                    lead.getCreatedAt());
        }
    }
}
