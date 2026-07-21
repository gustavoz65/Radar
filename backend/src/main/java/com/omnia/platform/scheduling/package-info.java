/**
 * Scheduling module: appointments, professional agendas and (next) resources/availability rules.
 *
 * <p>Cross-module references are weak ids + snapshots (customer/service/professional names are
 * copied at booking time) — no foreign keys into other modules' tables (ADR-002/DOMAIN.md §3).
 * Consumes the catalog public API to price/duration a booking.
 */
package com.omnia.platform.scheduling;
