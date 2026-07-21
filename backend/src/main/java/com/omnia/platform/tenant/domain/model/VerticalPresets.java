package com.omnia.platform.tenant.domain.model;

import com.omnia.platform.tenant.Vertical;

/**
 * Vertical presets: the UI-facing terminology and defaults each business segment starts with
 * (docs/product/MODULES.md). Only the customer term is applied today; enabled-modules and pipelines
 * join as those features land.
 */
public final class VerticalPresets {

    private VerticalPresets() {}

    public static String customerTerm(Vertical vertical) {
        return switch (vertical) {
            case HEALTH_CLINIC, AESTHETIC_CLINIC -> "Paciente";
            case GYM -> "Aluno";
            case PETSHOP -> "Tutor";
            case AUTO_REPAIR -> "Cliente";
            case REAL_ESTATE -> "Contato";
            default -> "Cliente";
        };
    }
}
