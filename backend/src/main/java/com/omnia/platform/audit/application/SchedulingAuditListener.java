package com.omnia.platform.audit.application;

import com.omnia.platform.audit.application.usecase.AuditService;
import com.omnia.platform.scheduling.AppointmentBooked;
import com.omnia.platform.shared.tenancy.TenantContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/** Appends an audit entry whenever an appointment is booked (demonstrates the trail; more producers follow). */
@Component
class SchedulingAuditListener {

    private final AuditService audit;

    SchedulingAuditListener(AuditService audit) {
        this.audit = audit;
    }

    @TransactionalEventListener
    void onAppointmentBooked(AppointmentBooked event) {
        TenantContext.runAs(
                event.tenantId(),
                () -> audit.record(
                        null,
                        "appointment.booked",
                        "Appointment",
                        event.appointmentId(),
                        "%s agendou %s".formatted(event.customerName(), event.serviceName())));
    }
}
