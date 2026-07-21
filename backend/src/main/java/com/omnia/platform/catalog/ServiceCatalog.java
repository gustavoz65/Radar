package com.omnia.platform.catalog;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/** Public API of the catalog module — read model other modules may consume (e.g. scheduling). */
public interface ServiceCatalog {

    Optional<ServiceSummary> findService(UUID id);

    record ServiceSummary(UUID id, String name, int durationMinutes, BigDecimal price, boolean active) {}
}
