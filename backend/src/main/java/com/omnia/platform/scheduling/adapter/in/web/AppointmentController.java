package com.omnia.platform.scheduling.adapter.in.web;

import com.omnia.platform.scheduling.application.usecase.SchedulingUseCases;
import com.omnia.platform.scheduling.domain.model.Appointment;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Appointments", description = "Agenda and bookings")
class AppointmentController {

    private final SchedulingUseCases useCases;

    AppointmentController(SchedulingUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping
    @Operation(summary = "List appointments in a period", description = "Optionally filtered by professional.")
    List<AppointmentResponse> agenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) UUID professionalId) {
        return useCases.agenda(from, to, professionalId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Book an appointment",
            description = "Duration and price come from the service; fails with appointment.overlap on conflicts.")
    AppointmentResponse book(@RequestBody @Valid BookRequest request) {
        return AppointmentResponse.from(useCases.book(new SchedulingUseCases.BookCommand(
                request.customerId(),
                request.professionalUserId(),
                request.serviceId(),
                request.startTime(),
                request.notes())));
    }

    @PutMapping("/{id}/schedule")
    @Operation(summary = "Reschedule an appointment", description = "Keeps duration; optionally moves professional.")
    AppointmentResponse reschedule(@PathVariable UUID id, @RequestBody @Valid RescheduleRequest request) {
        return AppointmentResponse.from(useCases.reschedule(id, request.startTime(), request.professionalUserId()));
    }

    @PostMapping("/{id}/transitions/{action}")
    @Operation(
            summary = "Transition an appointment",
            description = "Actions: confirm, start, complete, cancel, no-show. Invalid transitions return 422.")
    AppointmentResponse transition(
            @PathVariable UUID id,
            @PathVariable @Pattern(regexp = "confirm|start|complete|cancel|no-show") String action) {
        return AppointmentResponse.from(useCases.transition(id, action));
    }

    record BookRequest(
            @NotNull UUID customerId,
            @NotNull UUID professionalUserId,
            @NotNull UUID serviceId,
            @NotNull Instant startTime,
            @Size(max = 500) String notes) {}

    record RescheduleRequest(@NotNull Instant startTime, UUID professionalUserId) {}

    record AppointmentResponse(
            UUID id,
            UUID customerId,
            String customerName,
            UUID professionalUserId,
            String professionalName,
            UUID serviceId,
            String serviceName,
            BigDecimal price,
            Instant startTime,
            Instant endTime,
            String status,
            String notes) {

        static AppointmentResponse from(Appointment appointment) {
            return new AppointmentResponse(
                    appointment.getId(),
                    appointment.getCustomerId(),
                    appointment.getCustomerName(),
                    appointment.getProfessionalUserId(),
                    appointment.getProfessionalName(),
                    appointment.getServiceId(),
                    appointment.getServiceName(),
                    appointment.getPrice(),
                    appointment.getStartTime(),
                    appointment.getEndTime(),
                    appointment.getStatus().name(),
                    appointment.getNotes());
        }
    }
}
