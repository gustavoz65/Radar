package com.omnia.platform.shared.domain;

import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedEpochGenerator;
import java.util.UUID;

/** Application-generated UUIDv7 identifiers (time-ordered — ADR-005). */
public final class Ids {

    private static final TimeBasedEpochGenerator GENERATOR = Generators.timeBasedEpochGenerator();

    private Ids() {}

    public static UUID newId() {
        return GENERATOR.generate();
    }
}
