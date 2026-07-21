package com.omnia.platform.integration.application.usecase;

import com.omnia.platform.integration.application.port.out.WebhookSubscriptionRepository;
import com.omnia.platform.integration.domain.model.WebhookSubscription;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WebhookService {

    private final WebhookSubscriptionRepository subscriptions;

    public WebhookService(WebhookSubscriptionRepository subscriptions) {
        this.subscriptions = subscriptions;
    }

    @Transactional
    public WebhookSubscription subscribe(String eventType, String url) {
        return subscriptions.save(WebhookSubscription.create(TenantContext.require(), eventType, url));
    }

    @Transactional
    public void unsubscribe(UUID id) {
        WebhookSubscription subscription = subscriptions
                .findById(id)
                .filter(s -> s.getTenantId().equals(TenantContext.require()))
                .orElseThrow(() -> new NotFoundException("webhook.not-found", "Subscription not found"));
        subscription.deactivate();
        subscriptions.save(subscription);
    }

    @Transactional(readOnly = true)
    public List<WebhookSubscription> list() {
        return subscriptions.findAllForTenant();
    }
}
