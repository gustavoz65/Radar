package com.omnia.platform.scheduling.application.usecase;

import com.omnia.platform.catalog.ServiceCatalog;
import com.omnia.platform.customer.Customers;
import com.omnia.platform.identity.Members;
import com.omnia.platform.scheduling.AppointmentBooked;
import com.omnia.platform.scheduling.application.port.out.AppointmentRepository;
import com.omnia.platform.scheduling.domain.model.Appointment;
import com.omnia.platform.scheduling.domain.model.BookingDetails;
import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Booking and agenda operations. Talks to other modules ONLY through their public APIs (ADR-002). */
@Service
public class SchedulingUseCases {

    private final AppointmentRepository appointments;
    private final ServiceCatalog serviceCatalog;
    private final Customers customers;
    private final Members members;
    private final ApplicationEventPublisher events;

    public SchedulingUseCases(
            AppointmentRepository appointments,
            ServiceCatalog serviceCatalog,
            Customers customers,
            Members members,
            ApplicationEventPublisher events) {
        this.appointments = appointments;
        this.serviceCatalog = serviceCatalog;
        this.customers = customers;
        this.members = members;
        this.events = events;
    }

    @Transactional
    public Appointment book(BookCommand command) {
        var customer = customers
                .findById(command.customerId())
                .orElseThrow(() -> new NotFoundException("customer.not-found", "Customer not found"));
        var professional = members.findActiveById(command.professionalUserId())
                .orElseThrow(() -> new NotFoundException("member.not-found", "Professional not found"));
        var service = serviceCatalog
                .findService(command.serviceId())
                .filter(ServiceCatalog.ServiceSummary::active)
                .orElseThrow(() -> new NotFoundException("service.not-found", "Service not found or inactive"));

        Instant end = command.startTime().plus(Duration.ofMinutes(service.durationMinutes()));
        requireFreeSlot(professional.id(), command.startTime(), end, null);

        Appointment appointment = Appointment.book(new BookingDetails(
                TenantContext.require(),
                customer.id(),
                customer.name(),
                professional.id(),
                professional.name(),
                service.id(),
                service.name(),
                service.price(),
                command.startTime(),
                end,
                command.notes()));
        Appointment saved = appointments.save(appointment);
        events.publishEvent(new AppointmentBooked(
                saved.getTenantId(),
                saved.getId(),
                saved.getProfessionalUserId(),
                saved.getProfessionalName(),
                saved.getCustomerName(),
                saved.getServiceName(),
                saved.getStartTime()));
        return saved;
    }

    @Transactional
    public Appointment reschedule(UUID id, Instant newStart, UUID professionalUserId) {
        Appointment appointment = require(id);
        Duration duration = Duration.between(appointment.getStartTime(), appointment.getEndTime());
        Instant newEnd = newStart.plus(duration);

        UUID targetProfessional = professionalUserId != null ? professionalUserId : appointment.getProfessionalUserId();
        String professionalName = appointment.getProfessionalName();
        if (professionalUserId != null && !professionalUserId.equals(appointment.getProfessionalUserId())) {
            professionalName = members.findActiveById(professionalUserId)
                    .orElseThrow(() -> new NotFoundException("member.not-found", "Professional not found"))
                    .name();
        }
        requireFreeSlot(targetProfessional, newStart, newEnd, appointment.getId());

        appointment.reschedule(newStart, newEnd, professionalUserId, professionalName);
        return appointments.save(appointment);
    }

    @Transactional
    public Appointment transition(UUID id, String action) {
        Appointment appointment = require(id);
        switch (action) {
            case "confirm" -> appointment.confirm();
            case "start" -> appointment.start();
            case "complete" -> appointment.complete();
            case "cancel" -> appointment.cancel();
            case "no-show" -> appointment.markNoShow();
            default -> throw new DomainException("appointment.unknown-action", "Unknown action: " + action);
        }
        return appointments.save(appointment);
    }

    @Transactional(readOnly = true)
    public Appointment get(UUID id) {
        return require(id);
    }

    private Appointment require(UUID id) {
        return appointments
                .findById(id)
                .orElseThrow(() -> new NotFoundException("appointment.not-found", "Appointment not found"));
    }

    @Transactional(readOnly = true)
    public List<Appointment> agenda(Instant from, Instant to, UUID professionalUserId) {
        if (!to.isAfter(from) || Duration.between(from, to).toDays() > 62) {
            throw new DomainException("appointment.invalid-range", "Range must be positive and at most 62 days");
        }
        return appointments.findInPeriod(from, to, professionalUserId);
    }

    @Transactional(readOnly = true)
    public long countInPeriod(Instant from, Instant to) {
        return appointments.countInPeriod(from, to);
    }

    private void requireFreeSlot(UUID professionalUserId, Instant start, Instant end, UUID excludeId) {
        if (!appointments
                .findConflicts(professionalUserId, start, end, excludeId)
                .isEmpty()) {
            throw new DomainException(
                    "appointment.overlap", "The professional already has an appointment in this slot");
        }
    }

    public record BookCommand(
            UUID customerId, UUID professionalUserId, UUID serviceId, Instant startTime, String notes) {}
}
