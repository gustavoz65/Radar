package com.omnia.platform.workorder.adapter.in.web;

import com.omnia.platform.workorder.application.usecase.WorkOrderUseCases;
import com.omnia.platform.workorder.domain.model.WorkOrder;
import com.omnia.platform.workorder.domain.model.WorkOrderItem;
import com.omnia.platform.workorder.domain.model.WorkOrderStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
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
@RequestMapping("/api/v1/work-orders")
@Tag(name = "Work Orders", description = "Service jobs (OS)")
class WorkOrderController {

    private final WorkOrderUseCases useCases;

    WorkOrderController(WorkOrderUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping
    List<WorkOrderResponse> list() {
        return useCases.list().stream().map(WorkOrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    WorkOrderResponse get(@PathVariable UUID id) {
        return WorkOrderResponse.from(useCases.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Open a work order for a customer")
    WorkOrderResponse open(@RequestBody @Valid OpenRequest request) {
        return WorkOrderResponse.from(useCases.open(request.customerId(), request.title(), request.description()));
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Add a part/labor line")
    WorkOrderResponse addItem(@PathVariable UUID id, @RequestBody @Valid ItemRequest request) {
        return WorkOrderResponse.from(
                useCases.addItem(id, request.description(), request.quantity(), request.unitPrice()));
    }

    @PostMapping("/{id}/status")
    @Operation(summary = "Transition status (APPROVED/IN_PROGRESS/DONE/DELIVERED/CANCELLED)")
    WorkOrderResponse transition(@PathVariable UUID id, @RequestBody @Valid StatusRequest request) {
        return WorkOrderResponse.from(useCases.transition(id, request.status()));
    }

    record OpenRequest(@NotNull UUID customerId, @NotBlank String title, String description) {}

    record ItemRequest(
            @NotBlank String description, @Min(1) int quantity, @NotNull @DecimalMin("0.00") BigDecimal unitPrice) {}

    record StatusRequest(@NotNull WorkOrderStatus status) {}

    record WorkOrderResponse(
            UUID id,
            UUID customerId,
            String customerName,
            String title,
            String description,
            String status,
            List<ItemResponse> items,
            BigDecimal total,
            Instant createdAt) {

        static WorkOrderResponse from(WorkOrder order) {
            return new WorkOrderResponse(
                    order.getId(),
                    order.getCustomerId(),
                    order.getCustomerName(),
                    order.getTitle(),
                    order.getDescription(),
                    order.getStatus().name(),
                    order.getItems().stream().map(ItemResponse::from).toList(),
                    order.total(),
                    order.getCreatedAt());
        }
    }

    record ItemResponse(UUID id, String description, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
        static ItemResponse from(WorkOrderItem item) {
            return new ItemResponse(
                    item.getId(), item.getDescription(), item.getQuantity(), item.getUnitPrice(), item.lineTotal());
        }
    }
}
