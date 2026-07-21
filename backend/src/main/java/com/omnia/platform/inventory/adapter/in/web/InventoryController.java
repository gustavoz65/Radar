package com.omnia.platform.inventory.adapter.in.web;

import com.omnia.platform.inventory.application.usecase.InventoryUseCases;
import com.omnia.platform.inventory.domain.model.MovementType;
import com.omnia.platform.inventory.domain.model.StockItem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Stock balances and movements")
class InventoryController {

    private final InventoryUseCases useCases;

    InventoryController(InventoryUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping("/items")
    @Operation(summary = "List stock items (with low-stock flag)")
    List<StockItemResponse> list() {
        return useCases.list().stream().map(StockItemResponse::from).toList();
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Start tracking a product's stock")
    StockItemResponse track(@RequestBody @Valid TrackRequest request) {
        return StockItemResponse.from(
                useCases.trackProduct(request.productId(), request.productName(), request.minQuantity()));
    }

    @PostMapping("/items/{id}/movements")
    @Operation(summary = "Register a stock movement (IN/OUT/ADJUST)")
    StockItemResponse move(@PathVariable UUID id, @RequestBody @Valid MovementRequest request) {
        return StockItemResponse.from(useCases.move(id, request.type(), request.amount(), request.reason()));
    }

    record TrackRequest(@NotNull UUID productId, @NotBlank String productName, @Min(0) int minQuantity) {}

    record MovementRequest(@NotNull MovementType type, @Min(1) int amount, String reason) {}

    record StockItemResponse(
            UUID id, UUID productId, String productName, int quantity, int minQuantity, boolean belowMinimum) {

        static StockItemResponse from(StockItem item) {
            return new StockItemResponse(
                    item.getId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getQuantity(),
                    item.getMinQuantity(),
                    item.isBelowMinimum());
        }
    }
}
