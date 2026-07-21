package com.omnia.platform.scheduling.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Snapshot data needed to open an {@link Appointment}. Groups the customer/professional/service
 * copies (names, price, duration) so the aggregate factory keeps a small signature — the snapshots
 * are what keep the agenda historically accurate (DOMAIN.md §Scheduling).
 */
public record BookingDetails(
        UUID tenantId,
        UUID customerId,
        String customerName,
        UUID professionalUserId,
        String professionalName,
        UUID serviceId,
        String serviceName,
        BigDecimal price,
        Instant startTime,
        Instant endTime,
        String notes) {}
