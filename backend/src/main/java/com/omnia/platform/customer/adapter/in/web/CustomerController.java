package com.omnia.platform.customer.adapter.in.web;

import com.omnia.platform.customer.application.usecase.CustomerUseCases;
import com.omnia.platform.customer.domain.model.Customer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers")
@Tag(name = "Customers", description = "Tenant customer base (CRM core)")
class CustomerController {

    private static final int MAX_PAGE_SIZE = 100;

    private final CustomerUseCases useCases;

    CustomerController(CustomerUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping
    @Operation(summary = "Search customers", description = "Paginated; q matches name, e-mail or phone.")
    PagedModel<CustomerResponse> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(
                Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE), Sort.by(Sort.Direction.ASC, "name"));
        return new PagedModel<>(useCases.search(q, includeArchived, pageable).map(CustomerResponse::from));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a customer by id")
    CustomerResponse get(@PathVariable UUID id) {
        return CustomerResponse.from(useCases.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a customer")
    CustomerResponse register(@RequestBody @Valid CustomerRequest request) {
        return CustomerResponse.from(useCases.register(request.toCommand()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a customer")
    CustomerResponse update(@PathVariable UUID id, @RequestBody @Valid CustomerRequest request) {
        return CustomerResponse.from(useCases.update(id, request.toCommand()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Archive a customer",
            description = "Soft removal; history is preserved (LGPD erasure is a separate flow).")
    void archive(@PathVariable UUID id) {
        useCases.archive(id);
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore an archived customer")
    CustomerResponse restore(@PathVariable UUID id) {
        return CustomerResponse.from(useCases.restore(id));
    }

    record CustomerRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 160) String email,
            @Size(max = 40) String phone,
            @Size(max = 2000) String notes) {

        CustomerUseCases.Command toCommand() {
            return new CustomerUseCases.Command(name, email, phone, notes);
        }
    }

    record CustomerResponse(
            UUID id, String name, String email, String phone, String notes, String status, Instant createdAt) {

        static CustomerResponse from(Customer customer) {
            return new CustomerResponse(
                    customer.getId(),
                    customer.getName(),
                    customer.getEmail(),
                    customer.getPhone(),
                    customer.getNotes(),
                    customer.getStatus().name(),
                    customer.getCreatedAt());
        }
    }
}
