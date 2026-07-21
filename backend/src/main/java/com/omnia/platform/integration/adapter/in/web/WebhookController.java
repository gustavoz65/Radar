package com.omnia.platform.integration.adapter.in.web;

import com.omnia.platform.integration.application.usecase.WebhookService;
import com.omnia.platform.integration.domain.model.WebhookSubscription;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhooks")
@Tag(name = "Webhooks", description = "Outbound event subscriptions")
class WebhookController {

    private final WebhookService webhooks;

    WebhookController(WebhookService webhooks) {
        this.webhooks = webhooks;
    }

    @GetMapping
    List<WebhookResponse> list() {
        return webhooks.list().stream().map(WebhookResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Subscribe a URL to an event", description = "Events: appointment.booked, sale.completed")
    WebhookResponse subscribe(@RequestBody @Valid SubscribeRequest request) {
        return WebhookResponse.from(webhooks.subscribe(request.eventType(), request.url()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Deactivate a subscription")
    void unsubscribe(@PathVariable UUID id) {
        webhooks.unsubscribe(id);
    }

    record SubscribeRequest(
            @Pattern(regexp = "appointment\\.booked|sale\\.completed") String eventType, @NotBlank String url) {}

    record WebhookResponse(UUID id, String eventType, String url, String secret, boolean active, Instant createdAt) {

        static WebhookResponse from(WebhookSubscription s) {
            return new WebhookResponse(
                    s.getId(), s.getEventType(), s.getUrl(), s.getSecret(), s.isActive(), s.getCreatedAt());
        }
    }
}
