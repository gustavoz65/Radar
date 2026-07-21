package com.omnia.platform.notification.adapter.out.persistence;

import com.omnia.platform.notification.application.port.out.NotificationRepository;
import com.omnia.platform.notification.domain.model.Notification;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationJpaRepository extends NotificationRepository, JpaRepository<Notification, UUID> {

    List<Notification> findByTenantIdAndRecipientUserIdOrderByCreatedAtDesc(
            UUID tenantId, UUID recipientUserId, Limit limit);

    long countByTenantIdAndRecipientUserIdAndReadIsFalse(UUID tenantId, UUID recipientUserId);

    @Override
    default List<Notification> findRecentForRecipient(UUID recipientUserId, int limit) {
        return findByTenantIdAndRecipientUserIdOrderByCreatedAtDesc(
                TenantContext.require(), recipientUserId, Limit.of(limit));
    }

    @Override
    default long countUnread(UUID recipientUserId) {
        return countByTenantIdAndRecipientUserIdAndReadIsFalse(TenantContext.require(), recipientUserId);
    }
}
