package com.omnia.platform.inventory.application.port.out;

import com.omnia.platform.inventory.domain.model.StockItem;
import com.omnia.platform.inventory.domain.model.StockMovement;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockRepository {

    StockItem saveItem(StockItem item);

    StockMovement saveMovement(StockMovement movement);

    Optional<StockItem> findItem(UUID id);

    Optional<StockItem> findItemByProduct(UUID productId);

    List<StockItem> findAllItems();

    List<StockMovement> findMovements(UUID stockItemId, int limit);
}
