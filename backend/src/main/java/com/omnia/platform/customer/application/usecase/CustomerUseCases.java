package com.omnia.platform.customer.application.usecase;

import com.omnia.platform.customer.application.port.out.CustomerRepository;
import com.omnia.platform.customer.domain.model.Customer;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Customer commands and queries. Small enough to live in one application service for now; split
 * per-use-case classes when policies (permissions, events, custom fields) start diverging.
 */
@Service
public class CustomerUseCases {

    private final CustomerRepository customers;

    public CustomerUseCases(CustomerRepository customers) {
        this.customers = customers;
    }

    @Transactional
    public Customer register(Command command) {
        Customer customer = Customer.register(
                TenantContext.require(), command.name(), command.email(), command.phone(), command.notes());
        return customers.save(customer);
    }

    @Transactional
    public Customer update(UUID id, Command command) {
        Customer customer = get(id);
        customer.update(command.name(), command.email(), command.phone(), command.notes());
        return customers.save(customer);
    }

    @Transactional
    public void archive(UUID id) {
        Customer customer = get(id);
        customer.archive();
        customers.save(customer);
    }

    @Transactional
    public Customer restore(UUID id) {
        Customer customer = get(id);
        customer.restore();
        return customers.save(customer);
    }

    @Transactional(readOnly = true)
    public Customer get(UUID id) {
        return customers
                .findById(id)
                .orElseThrow(() -> new NotFoundException("customer.not-found", "Customer not found"));
    }

    @Transactional(readOnly = true)
    public Page<Customer> search(String query, boolean includeArchived, Pageable pageable) {
        return customers.search(query, includeArchived, pageable);
    }

    public record Command(String name, String email, String phone, String notes) {}
}
