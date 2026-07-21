package com.omnia.platform.catalog.application.port.out;

import com.omnia.platform.catalog.domain.model.ServiceOffering;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceOfferingRepository {

    ServiceOffering save(ServiceOffering service);

    Optional<ServiceOffering> findById(UUID id);

    List<ServiceOffering> findAllOrdered(boolean includeInactive);
}
