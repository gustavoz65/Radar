package com.omnia.platform.catalog.adapter.out;

import com.omnia.platform.catalog.ServiceCatalog;
import com.omnia.platform.catalog.application.port.out.ServiceOfferingRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class ServiceCatalogService implements ServiceCatalog {

    private final ServiceOfferingRepository services;

    ServiceCatalogService(ServiceOfferingRepository services) {
        this.services = services;
    }

    @Override
    public Optional<ServiceSummary> findService(UUID id) {
        return services.findById(id)
                .map(service -> new ServiceSummary(
                        service.getId(),
                        service.getName(),
                        service.getDurationMinutes(),
                        service.getPrice(),
                        service.isActive()));
    }
}
