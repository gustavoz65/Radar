package com.omnia.platform.inventory.application.usecase;

import com.omnia.platform.inventory.application.port.out.StockRepository;
import com.omnia.platform.inventory.domain.model.MovementType;
import com.omnia.platform.inventory.domain.model.StockItem;
import com.omnia.platform.inventory.domain.model.StockMovement;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryUseCases {

    private final StockRepository stock;

    public InventoryUseCases(StockRepository stock) {
        this.stock = stock;
    }

    @Transactional
    public StockItem trackProduct(UUID productId, String productName, int minQuantity) {
        return stock.findItemByProduct(productId)
                .orElseGet(() ->
                        stock.saveItem(StockItem.create(TenantContext.require(), productId, productName, minQuantity)));
    }

    /** Registers a movement AND updates the derived balance in one transaction. */
    @Transactional
    public StockItem move(UUID stockItemId, MovementType type, int amount, String reason) {
        StockItem item = stock.findItem(stockItemId)
                .filter(i -> i.getTenantId().equals(TenantContext.require()))
                .orElseThrow(() -> new NotFoundException("stock.not-found", "Stock item not found"));
        item.apply(type, amount);
        StockItem saved = stock.saveItem(item);
        stock.saveMovement(new StockMovement(saved.getTenantId(), saved.getId(), type, amount, reason));
        return saved;
    }

    @Transactional
    public StockItem setMinimum(UUID stockItemId, int minQuantity) {
        StockItem item = stock.findItem(stockItemId)
                .filter(i -> i.getTenantId().equals(TenantContext.require()))
                .orElseThrow(() -> new NotFoundException("stock.not-found", "Stock item not found"));
        item.setMinQuantity(minQuantity);
        return stock.saveItem(item);
    }

    @Transactional(readOnly = true)
    public List<StockItem> list() {
        return stock.findAllItems();
    }

    @Transactional(readOnly = true)
    public List<StockMovement> movements(UUID stockItemId) {
        return stock.findMovements(stockItemId, 50);
    }
}
