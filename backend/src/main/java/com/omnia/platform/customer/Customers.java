package com.omnia.platform.customer;

import java.util.Optional;
import java.util.UUID;

/** Public API of the customer module for other modules (scheduling, sales...). */
public interface Customers {

    Optional<CustomerSummary> findById(UUID id);

    record CustomerSummary(UUID id, String name, String email, String phone) {}
}
