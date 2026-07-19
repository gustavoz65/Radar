package com.omnia.platform.tenant;

/**
 * Business vertical selected at signup. Drives the configuration preset (enabled modules,
 * terminology, default roles and pipelines) — see docs/product/MODULES.md.
 *
 * <p>Lives in the module's base package because it is part of the tenant public API.
 */
public enum Vertical {
    BARBERSHOP,
    BEAUTY_SALON,
    AESTHETIC_CLINIC,
    HEALTH_CLINIC,
    GYM,
    PETSHOP,
    AUTO_REPAIR,
    REAL_ESTATE,
    SERVICES,
    GENERIC
}
