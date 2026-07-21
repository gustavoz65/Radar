package com.omnia.platform.crm.application.port.out;

import com.omnia.platform.crm.domain.model.Lead;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadRepository {

    Lead save(Lead lead);

    Optional<Lead> findById(UUID id);

    List<Lead> findAllOrdered();
}
