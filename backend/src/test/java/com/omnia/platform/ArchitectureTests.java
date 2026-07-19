package com.omnia.platform;

import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.Architectures;

/** Layer rules inside every module (ADR-004): adapter → application → domain, never inward-out. */
@AnalyzeClasses(packages = "com.omnia.platform")
class ArchitectureTests {

    @ArchTest
    static final ArchRule layeredArchitecture = Architectures.onionArchitecture()
            .domainModels("..domain.model..")
            .domainServices("..domain.service..")
            .applicationServices("..application..")
            .adapter("web", "..adapter.in.web..")
            .adapter("persistence", "..adapter.out..")
            .withOptionalLayers(true);
}
