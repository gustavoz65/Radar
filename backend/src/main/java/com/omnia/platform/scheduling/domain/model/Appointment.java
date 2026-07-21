package com.omnia.platform.scheduling.domain.model;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Appointment aggregate. Names and price/duration are snapshots taken at booking time: the agenda
 * must stay historically accurate even if the customer is renamed or the service repriced later.
 * State transitions are aggregate methods; invalid ones throw (DOMAIN.md §4).
 */
@Entity
@Table(name = "appointments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Appointment {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "professional_user_id", nullable = false)
    private UUID professionalUserId;

    @Column(name = "professional_name", nullable = false)
    private String professionalName;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private long version;

    private Appointment(BookingDetails details) {
        this.id = Ids.newId();
        this.tenantId = details.tenantId();
        this.customerId = details.customerId();
        this.customerName = details.customerName();
        this.professionalUserId = details.professionalUserId();
        this.professionalName = details.professionalName();
        this.serviceId = details.serviceId();
        this.serviceName = details.serviceName();
        this.price = details.price();
        this.startTime = details.startTime();
        this.endTime = details.endTime();
        this.notes = details.notes() == null || details.notes().isBlank()
                ? null
                : details.notes().trim();
        this.status = AppointmentStatus.SCHEDULED;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    /** Booking factory enforcing creation invariants. */
    public static Appointment book(BookingDetails details) {
        if (details.tenantId() == null) {
            throw new DomainException("appointment.tenant-required", "An appointment must belong to a tenant");
        }
        if (details.startTime() == null
                || details.endTime() == null
                || !details.endTime().isAfter(details.startTime())) {
            throw new DomainException("appointment.invalid-period", "End must be after start");
        }
        return new Appointment(details);
    }

    public void confirm() {
        transition(AppointmentStatus.CONFIRMED, Set.of(AppointmentStatus.SCHEDULED));
    }

    public void start() {
        transition(AppointmentStatus.IN_PROGRESS, Set.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED));
    }

    public void complete() {
        transition(
                AppointmentStatus.COMPLETED,
                Set.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS));
    }

    public void cancel() {
        transition(
                AppointmentStatus.CANCELLED,
                Set.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS));
    }

    public void markNoShow() {
        transition(AppointmentStatus.NO_SHOW, Set.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED));
    }

    /** Rescheduling keeps status but moves the slot (and optionally the professional). */
    public void reschedule(Instant newStart, Instant newEnd, UUID professionalUserId, String professionalName) {
        if (!status.occupiesAgenda()) {
            throw new DomainException(
                    "appointment.not-reschedulable",
                    "Only open appointments can be rescheduled (status: " + status + ")");
        }
        if (newStart == null || newEnd == null || !newEnd.isAfter(newStart)) {
            throw new DomainException("appointment.invalid-period", "End must be after start");
        }
        this.startTime = newStart;
        this.endTime = newEnd;
        if (professionalUserId != null) {
            this.professionalUserId = professionalUserId;
            this.professionalName = professionalName;
        }
        this.updatedAt = Instant.now();
    }

    private void transition(AppointmentStatus next, Set<AppointmentStatus> allowedFrom) {
        if (!allowedFrom.contains(status)) {
            throw new DomainException(
                    "appointment.invalid-transition", "Cannot go from %s to %s".formatted(status, next));
        }
        this.status = next;
        this.updatedAt = Instant.now();
    }
}
