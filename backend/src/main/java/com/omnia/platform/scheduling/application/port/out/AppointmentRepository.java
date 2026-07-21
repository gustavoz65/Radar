package com.omnia.platform.scheduling.application.port.out;

import com.omnia.platform.scheduling.domain.model.Appointment;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppointmentRepository {

    Appointment save(Appointment appointment);

    Optional<Appointment> findById(UUID id);

    List<Appointment> findInPeriod(Instant from, Instant to, UUID professionalUserId);

    /** Open (agenda-occupying) appointments of a professional overlapping the given slot. */
    List<Appointment> findConflicts(UUID professionalUserId, Instant start, Instant end, UUID excludeId);

    long countInPeriod(Instant from, Instant to);
}
