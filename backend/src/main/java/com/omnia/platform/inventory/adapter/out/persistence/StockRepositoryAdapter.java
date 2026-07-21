package com.omnia.platform.inventory.adapter.out.persistence;

import com.omnia.platform.inventory.application.port.out.StockRepository;
import com.omnia.platform.inventory.domain.model.StockItem;
import com.omnia.platform.inventory.domain.model.StockMovement;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
class StockRepositoryAdapter implements StockRepository {

    private final StockItemJpaRepository items;
    private final StockMovementJpaRepository movements;

    StockRepositoryAdapter(StockItemJpaRepository items, StockMovementJpaRepository movements) {
        this.items = items;
        this.movements = movements;
    }

    @Override
    public StockItem saveItem(StockItem item) {
        return items.save(item);
    }

    @Override
    public StockMovement saveMovement(StockMovement movement) {
        return movements.save(movement);
    }

    @Override
    public Optional<StockItem> findItem(UUID id) {
        return items.findById(id);
    }

    @Override
    public Optional<StockItem> findItemByProduct(UUID productId) {
        return items.findByProduct(productId);
    }

    @Override
    public List<StockItem> findAllItems() {
        return items.findAllForTenant();
    }

    @Override
    public List<StockMovement> findMovements(UUID stockItemId, int limit) {
        return movements.findRecent(stockItemId, limit);
    }
}
