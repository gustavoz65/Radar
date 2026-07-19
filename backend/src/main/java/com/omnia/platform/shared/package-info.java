/**
 * Shared kernel: multi-tenancy context, base domain types (Money, exceptions, ids) and
 * cross-cutting web/persistence infrastructure. Contains NO business rules.
 *
 * <p>Open module: every business module may depend on it; it depends on no business module.
 */
@org.springframework.modulith.ApplicationModule(type = org.springframework.modulith.ApplicationModule.Type.OPEN)
package com.omnia.platform.shared;
