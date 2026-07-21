package com.omnia.platform.catalog.application.usecase;

import com.omnia.platform.catalog.application.port.out.ProductRepository;
import com.omnia.platform.catalog.application.port.out.ServiceOfferingRepository;
import com.omnia.platform.catalog.domain.model.Product;
import com.omnia.platform.catalog.domain.model.ServiceOffering;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogUseCases {

    private final ServiceOfferingRepository services;
    private final ProductRepository products;

    public CatalogUseCases(ServiceOfferingRepository services, ProductRepository products) {
        this.services = services;
        this.products = products;
    }

    // --- services ---

    @Transactional
    public ServiceOffering createService(ServiceCommand command) {
        return services.save(ServiceOffering.create(
                TenantContext.require(),
                command.name(),
                command.description(),
                command.durationMinutes(),
                command.price()));
    }

    @Transactional
    public ServiceOffering updateService(UUID id, ServiceCommand command) {
        ServiceOffering service = getService(id);
        service.update(command.name(), command.description(), command.durationMinutes(), command.price());
        return services.save(service);
    }

    @Transactional
    public ServiceOffering toggleService(UUID id, boolean active) {
        ServiceOffering service = getService(id);
        if (active) {
            service.activate();
        } else {
            service.deactivate();
        }
        return services.save(service);
    }

    @Transactional(readOnly = true)
    public ServiceOffering getService(UUID id) {
        return services.findById(id).orElseThrow(() -> new NotFoundException("service.not-found", "Service not found"));
    }

    @Transactional(readOnly = true)
    public List<ServiceOffering> listServices(boolean includeInactive) {
        return services.findAllOrdered(includeInactive);
    }

    // --- products ---

    @Transactional
    public Product createProduct(ProductCommand command) {
        return products.save(Product.create(
                TenantContext.require(), command.name(), command.sku(), command.price(), command.cost()));
    }

    @Transactional
    public Product updateProduct(UUID id, ProductCommand command) {
        Product product = getProduct(id);
        product.update(command.name(), command.sku(), command.price(), command.cost());
        return products.save(product);
    }

    @Transactional
    public Product toggleProduct(UUID id, boolean active) {
        Product product = getProduct(id);
        if (active) {
            product.activate();
        } else {
            product.deactivate();
        }
        return products.save(product);
    }

    @Transactional(readOnly = true)
    public Product getProduct(UUID id) {
        return products.findById(id).orElseThrow(() -> new NotFoundException("product.not-found", "Product not found"));
    }

    @Transactional(readOnly = true)
    public List<Product> listProducts(boolean includeInactive) {
        return products.findAllOrdered(includeInactive);
    }

    public record ServiceCommand(String name, String description, int durationMinutes, BigDecimal price) {}

    public record ProductCommand(String name, String sku, BigDecimal price, BigDecimal cost) {}
}
