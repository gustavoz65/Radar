/**
 * Analytics module: read-model projections built from other modules' domain events (CQRS-lite,
 * ADR-006). It never reads other modules' tables — it maintains its own daily aggregates from
 * {@code AppointmentBooked} and {@code SaleCompleted}.
 */
package com.omnia.platform.analytics;
