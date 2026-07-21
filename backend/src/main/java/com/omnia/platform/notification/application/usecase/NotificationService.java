package com.omnia.platform.notification.application.usecase;

import com.omnia.platform.notification.application.port.out.NotificationRepository;
import com.omnia.platform.notification.domain.model.Notification;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Transactional
    public Notification push(UUID tenantId, UUID recipientUserId, String title, String body) {
        return notifications.save(Notification.to(tenantId, recipientUserId, title, body));
    }

    @Transactional(readOnly = true)
    public List<Notification> recent(UUID recipientUserId, int limit) {
        return notifications.findRecentForRecipient(recipientUserId, limit);
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID recipientUserId) {
        return notifications.countUnread(recipientUserId);
    }

    @Transactional
    public void markRead(UUID id) {
        Notification notification = notifications
                .findById(id)
                .filter(n -> n.getTenantId().equals(TenantContext.require()))
                .orElseThrow(() -> new NotFoundException("notification.not-found", "Notification not found"));
        notification.markRead();
        notifications.save(notification);
    }
}
