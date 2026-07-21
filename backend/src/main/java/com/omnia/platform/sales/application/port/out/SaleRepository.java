package com.omnia.platform.sales.application.port.out;

import com.omnia.platform.sales.domain.model.Sale;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository {

    Sale save(Sale sale);

    Optional<Sale> findById(UUID id);

    List<Sale> findRecent(int limit);
}
