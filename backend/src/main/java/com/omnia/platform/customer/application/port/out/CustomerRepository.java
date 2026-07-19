package com.omnia.platform.customer.application.port.out;

import com.omnia.platform.customer.domain.model.Customer;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Persistence port. Queries are tenant-scoped twice: explicitly here and by RLS at the database
 * (defense in depth, ADR-003).
 */
public interface CustomerRepository {

    Customer save(Customer customer);

    Optional<Customer> findById(UUID id);

    Page<Customer> search(String query, boolean includeArchived, Pageable pageable);
}
