package com.omnia.platform.integration.application.port.out;

import com.omnia.platform.integration.domain.model.WebhookSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebhookSubscriptionRepository {

    WebhookSubscription save(WebhookSubscription subscription);

    Optional<WebhookSubscription> findById(UUID id);

    List<WebhookSubscription> findAllForTenant();

    /** Active subscriptions across all tenants for an event — used by the dispatcher (system scope). */
    List<WebhookSubscription> findActiveByTenantAndEvent(UUID tenantId, String eventType);
}
