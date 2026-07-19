package com.omnia.platform.customer.adapter.out.persistence;

import com.omnia.platform.customer.application.port.out.CustomerRepository;
import com.omnia.platform.customer.domain.model.Customer;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerJpaRepository extends CustomerRepository, JpaRepository<Customer, UUID> {

    @Query(
            """
            SELECT c FROM Customer c
            WHERE c.tenantId = :tenantId
              AND (:includeArchived = TRUE OR c.status = com.omnia.platform.customer.domain.model.CustomerStatus.ACTIVE)
              AND (:query IS NULL OR :query = ''
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                   OR COALESCE(c.phone, '') LIKE CONCAT('%', :query, '%'))
            """)
    Page<Customer> searchScoped(
            @Param("tenantId") UUID tenantId,
            @Param("query") String query,
            @Param("includeArchived") boolean includeArchived,
            Pageable pageable);

    @Override
    default Page<Customer> search(String query, boolean includeArchived, Pageable pageable) {
        return searchScoped(TenantContext.require(), query, includeArchived, pageable);
    }
}
