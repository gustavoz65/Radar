package com.omnia.platform.customer.adapter.out;

import com.omnia.platform.customer.Customers;
import com.omnia.platform.customer.application.port.out.CustomerRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class CustomersService implements Customers {

    private final CustomerRepository repository;

    CustomersService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<CustomerSummary> findById(UUID id) {
        return repository
                .findById(id)
                .map(customer -> new CustomerSummary(
                        customer.getId(), customer.getName(), customer.getEmail(), customer.getPhone()));
    }
}
