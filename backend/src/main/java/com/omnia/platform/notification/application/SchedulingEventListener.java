package com.omnia.platform.notification.application;

import com.omnia.platform.notification.application.usecase.NotificationService;
import com.omnia.platform.scheduling.AppointmentBooked;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Turns scheduling domain events into in-app notifications. Runs after the booking commits and
 * rebinds the tenant from the event so RLS admits the insert (the async boundary loses the
 * request-scoped {@link TenantContext}).
 */
@Component
class SchedulingEventListener {

    private static final DateTimeFormatter TIME =
            DateTimeFormatter.ofPattern("dd/MM 'às' HH:mm").withZone(ZoneId.of("America/Sao_Paulo"));

    private final NotificationService notifications;

    SchedulingEventListener(NotificationService notifications) {
        this.notifications = notifications;
    }

    @TransactionalEventListener
    void onAppointmentBooked(AppointmentBooked event) {
        TenantContext.runAs(
                event.tenantId(),
                () -> notifications.push(
                        event.tenantId(),
                        event.professionalUserId(),
                        "Novo agendamento",
                        "%s — %s em %s"
                                .formatted(event.customerName(), event.serviceName(), TIME.format(event.startTime()))));
    }
}
