/**
 * Customer module: the tenant's customer base (CRM core). Canonical term is Customer — vertical
 * synonyms (paciente, aluno, tutor) are presentation-layer only (DOMAIN.md).
 *
 * <p>All tables are tenant-scoped under RLS. No public API yet — other modules will consume
 * customer data via events/summaries when scheduling and sales arrive.
 */
package com.omnia.platform.customer;
