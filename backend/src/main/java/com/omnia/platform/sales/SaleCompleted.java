package com.omnia.platform.sales;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Published when a sale is paid in full. Finance turns it into a revenue entry; analytics counts it.
 * Cross-module contract (ADR-006) — keep it stable.
 */
public record SaleCompleted(
        UUID tenantId, UUID saleId, UUID customerId, String customerName, BigDecimal total, Instant completedAt) {}
