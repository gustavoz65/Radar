package com.omnia.platform.notification.adapter.in.web;

import com.omnia.platform.notification.application.usecase.NotificationService;
import com.omnia.platform.notification.domain.model.Notification;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "In-app notification center")
class NotificationController {

    private final NotificationService notifications;

    NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    @Operation(summary = "Recent notifications for the current user")
    NotificationsResponse list(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<NotificationResponse> items = notifications.recent(userId, 20).stream()
                .map(NotificationResponse::from)
                .toList();
        return new NotificationsResponse(items, notifications.unreadCount(userId));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    void markRead(@PathVariable UUID id) {
        notifications.markRead(id);
    }

    record NotificationsResponse(List<NotificationResponse> items, long unread) {}

    record NotificationResponse(UUID id, String title, String body, boolean read, Instant createdAt) {

        static NotificationResponse from(Notification n) {
            return new NotificationResponse(n.getId(), n.getTitle(), n.getBody(), n.isRead(), n.getCreatedAt());
        }
    }
}
