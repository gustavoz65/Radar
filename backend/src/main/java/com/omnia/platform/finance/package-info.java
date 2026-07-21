/**
 * Finance module: cash ledger (income/expense entries), cash-flow summary. Turns sales' {@code
 * SaleCompleted} events into revenue entries. References sales by weak id (source_type/source_id) —
 * never a cross-module FK (DOMAIN.md §Finance).
 */
package com.omnia.platform.finance;
