package com.omnia.platform.sales.application.usecase;

import com.omnia.platform.catalog.ServiceCatalog;
import com.omnia.platform.customer.Customers;
import com.omnia.platform.sales.SaleCompleted;
import com.omnia.platform.sales.application.port.out.SaleRepository;
import com.omnia.platform.sales.domain.model.Sale;
import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Sale (comanda) lifecycle. Prices for service lines come from the catalog public API. */
@Service
public class SalesUseCases {

    private final SaleRepository sales;
    private final Customers customers;
    private final ServiceCatalog serviceCatalog;
    private final ApplicationEventPublisher events;

    public SalesUseCases(
            SaleRepository sales,
            Customers customers,
            ServiceCatalog serviceCatalog,
            ApplicationEventPublisher events) {
        this.sales = sales;
        this.customers = customers;
        this.serviceCatalog = serviceCatalog;
        this.events = events;
    }

    @Transactional
    public Sale open(UUID customerId) {
        String customerName = null;
        if (customerId != null) {
            customerName = customers
                    .findById(customerId)
                    .orElseThrow(() -> new NotFoundException("customer.not-found", "Customer not found"))
                    .name();
        }
        return sales.save(Sale.open(TenantContext.require(), customerId, customerName));
    }

    @Transactional
    public Sale addServiceItem(UUID saleId, UUID serviceId, int quantity) {
        var service = serviceCatalog
                .findService(serviceId)
                .orElseThrow(() -> new NotFoundException("service.not-found", "Service not found"));
        Sale sale = get(saleId);
        sale.addItem("SERVICE", service.id(), service.name(), quantity, service.price());
        return sales.save(sale);
    }

    @Transactional
    public Sale addManualItem(UUID saleId, String description, int quantity, BigDecimal unitPrice) {
        if (description == null || description.isBlank()) {
            throw new DomainException("sale.invalid-item", "Description is required");
        }
        Sale sale = get(saleId);
        sale.addItem("PRODUCT", null, description.trim(), quantity, unitPrice);
        return sales.save(sale);
    }

    @Transactional
    public Sale applyDiscount(UUID saleId, BigDecimal discount) {
        Sale sale = get(saleId);
        sale.applyDiscount(discount);
        return sales.save(sale);
    }

    @Transactional
    public Sale addPayment(UUID saleId, String method, BigDecimal amount) {
        Sale sale = get(saleId);
        sale.addPayment(method, amount);
        return sales.save(sale);
    }

    @Transactional
    public Sale complete(UUID saleId) {
        Sale sale = get(saleId);
        sale.complete();
        Sale saved = sales.save(sale);
        events.publishEvent(new SaleCompleted(
                saved.getTenantId(),
                saved.getId(),
                saved.getCustomerId(),
                saved.getCustomerName(),
                saved.total(),
                saved.getCompletedAt()));
        return saved;
    }

    @Transactional
    public Sale cancel(UUID saleId) {
        Sale sale = get(saleId);
        sale.cancel();
        return sales.save(sale);
    }

    @Transactional(readOnly = true)
    public Sale get(UUID saleId) {
        return sales.findById(saleId).orElseThrow(() -> new NotFoundException("sale.not-found", "Sale not found"));
    }

    @Transactional(readOnly = true)
    public List<Sale> recent(int limit) {
        return sales.findRecent(limit);
    }
}
