/**
 * Audit module: append-only trail of sensitive actions (LGPD). Rows are never updated or deleted.
 * Other modules record via the {@link com.omnia.platform.audit.AuditTrail} public API or by emitting
 * domain events this module listens to.
 */
package com.omnia.platform.audit;
