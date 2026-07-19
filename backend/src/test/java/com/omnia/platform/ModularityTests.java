package com.omnia.platform;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Enforces module boundaries (ADR-002): illegal cross-module dependencies and cycles fail the
 * build. Also generates living architecture documentation (C4/PlantUML) under
 * target/spring-modulith-docs.
 */
class ModularityTests {

    static final ApplicationModules modules = ApplicationModules.of(OmniaApplication.class);

    @Test
    void verifyModuleBoundaries() {
        modules.verify();
    }

    @Test
    void generateModuleDocumentation() {
        new Documenter(modules).writeDocumentation();
    }
}
