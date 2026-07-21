package com.omnia.platform.scheduling.domain.model;

/** State machine documented in DOMAIN.md §4. BILLED arrives with the sales module. */
public enum AppointmentStatus {
    SCHEDULED,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    NO_SHOW;

    /** Statuses that occupy the professional's agenda (block overlapping bookings). */
    public boolean occupiesAgenda() {
        return this == SCHEDULED || this == CONFIRMED || this == IN_PROGRESS;
    }
}
