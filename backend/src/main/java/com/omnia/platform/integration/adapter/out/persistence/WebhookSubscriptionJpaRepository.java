package com.omnia.platform.integration.adapter.out.persistence;

import com.omnia.platform.integration.application.port.out.WebhookSubscriptionRepository;
import com.omnia.platform.integration.domain.model.WebhookSubscription;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookSubscriptionJpaRepository
        extends WebhookSubscriptionRepository, JpaRepository<WebhookSubscription, UUID> {

    List<WebhookSubscription> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<WebhookSubscription> findByTenantIdAndEventTypeAndActiveIsTrue(UUID tenantId, String eventType);

    @Override
    default List<WebhookSubscription> findAllForTenant() {
        return findByTenantIdOrderByCreatedAtDesc(TenantContext.require());
    }

    @Override
    default List<WebhookSubscription> findActiveByTenantAndEvent(UUID tenantId, String eventType) {
        return findByTenantIdAndEventTypeAndActiveIsTrue(tenantId, eventType);
    }
}
