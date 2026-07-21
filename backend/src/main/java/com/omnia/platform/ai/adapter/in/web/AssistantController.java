package com.omnia.platform.ai.adapter.in.web;

import com.omnia.platform.ai.application.usecase.AssistantUseCases;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
@Tag(name = "AI Assistant", description = "AI features (deterministic fallback by default)")
class AssistantController {

    private final AssistantUseCases assistant;

    AssistantController(AssistantUseCases assistant) {
        this.assistant = assistant;
    }

    @GetMapping("/customers/{id}/summary")
    @Operation(summary = "Summarize a customer for quick service")
    AssistantResponse summarize(@PathVariable UUID id) {
        var result = assistant.summarizeCustomer(id);
        return new AssistantResponse(result.text(), result.live());
    }

    @PostMapping("/draft-message")
    @Operation(summary = "Draft a customer message", description = "kind: reminder, return, thanks")
    AssistantResponse draft(@RequestBody DraftRequest request) {
        var result = assistant.draftMessage(request.kind(), request.customerName());
        return new AssistantResponse(result.text(), result.live());
    }

    record DraftRequest(@Pattern(regexp = "reminder|return|thanks") String kind, @NotBlank String customerName) {}

    record AssistantResponse(String text, boolean aiPowered) {}
}
