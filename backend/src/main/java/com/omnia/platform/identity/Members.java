package com.omnia.platform.identity;

import java.util.Optional;
import java.util.UUID;

/** Public API of the identity module: tenant members as seen by other modules (scheduling...). */
public interface Members {

    Optional<MemberSummary> findActiveById(UUID id);

    record MemberSummary(UUID id, String name) {}
}
