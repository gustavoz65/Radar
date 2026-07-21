package com.omnia.platform.scheduling;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event published when an appointment is booked. Part of the scheduling module's public API
 * so other modules (notification, and later finance/analytics) can react without scheduling knowing
 * about them (ADR-006).
 */
public record AppointmentBooked(
        UUID tenantId,
        UUID appointmentId,
        UUID professionalUserId,
        String professionalName,
        String customerName,
        String serviceName,
        Instant startTime) {}
