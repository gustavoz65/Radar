package com.omnia.platform.sales.adapter.in.web;

import com.omnia.platform.sales.application.usecase.SalesUseCases;
import com.omnia.platform.sales.domain.model.Sale;
import com.omnia.platform.sales.domain.model.SaleItem;
import com.omnia.platform.sales.domain.model.SalePayment;
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
@RequestMapping("/api/v1/sales")
@Tag(name = "Sales", description = "Point-of-sale comandas")
class SaleController {

    private final SalesUseCases useCases;

    SaleController(SalesUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping
    @Operation(summary = "Recent sales")
    List<SaleResponse> recent() {
        return useCases.recent(50).stream().map(SaleResponse::from).toList();
    }

    @GetMapping("/{id}")
    SaleResponse get(@PathVariable UUID id) {
        return SaleResponse.from(useCases.get(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Open a sale (comanda)")
    SaleResponse open(@RequestBody OpenSaleRequest request) {
        return SaleResponse.from(useCases.open(request == null ? null : request.customerId()));
    }

    @PostMapping("/{id}/service-items")
    @Operation(summary = "Add a catalog service line")
    SaleResponse addService(@PathVariable UUID id, @RequestBody @Valid ServiceItemRequest request) {
        return SaleResponse.from(useCases.addServiceItem(id, request.serviceId(), request.quantity()));
    }

    @PostMapping("/{id}/items")
    @Operation(summary = "Add a manual/product line")
    SaleResponse addItem(@PathVariable UUID id, @RequestBody @Valid ManualItemRequest request) {
        return SaleResponse.from(
                useCases.addManualItem(id, request.description(), request.quantity(), request.unitPrice()));
    }

    @PostMapping("/{id}/discount")
    @Operation(summary = "Apply a discount")
    SaleResponse discount(@PathVariable UUID id, @RequestBody @Valid DiscountRequest request) {
        return SaleResponse.from(useCases.applyDiscount(id, request.discount()));
    }

    @PostMapping("/{id}/payments")
    @Operation(summary = "Register a payment")
    SaleResponse pay(@PathVariable UUID id, @RequestBody @Valid PaymentRequest request) {
        return SaleResponse.from(useCases.addPayment(id, request.method(), request.amount()));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete (mark paid) the sale", description = "Emits SaleCompleted for finance/analytics.")
    SaleResponse complete(@PathVariable UUID id) {
        return SaleResponse.from(useCases.complete(id));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an open sale")
    SaleResponse cancel(@PathVariable UUID id) {
        return SaleResponse.from(useCases.cancel(id));
    }

    record OpenSaleRequest(UUID customerId) {}

    record ServiceItemRequest(@NotNull UUID serviceId, @Min(1) int quantity) {}

    record ManualItemRequest(
            @NotBlank String description, @Min(1) int quantity, @NotNull @DecimalMin("0.00") BigDecimal unitPrice) {}

    record DiscountRequest(@NotNull @DecimalMin("0.00") BigDecimal discount) {}

    record PaymentRequest(@NotBlank String method, @NotNull @DecimalMin("0.01") BigDecimal amount) {}

    record SaleResponse(
            UUID id,
            UUID customerId,
            String customerName,
            String status,
            List<ItemResponse> items,
            List<PaymentResponse> payments,
            BigDecimal discount,
            BigDecimal total,
            BigDecimal paid,
            Instant createdAt,
            Instant completedAt) {

        static SaleResponse from(Sale sale) {
            return new SaleResponse(
                    sale.getId(),
                    sale.getCustomerId(),
                    sale.getCustomerName(),
                    sale.getStatus().name(),
                    sale.getItems().stream().map(ItemResponse::from).toList(),
                    sale.getPayments().stream().map(PaymentResponse::from).toList(),
                    sale.getDiscount(),
                    sale.total(),
                    sale.paymentsTotal(),
                    sale.getCreatedAt(),
                    sale.getCompletedAt());
        }
    }

    record ItemResponse(
            UUID id, String kind, String description, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
        static ItemResponse from(SaleItem item) {
            return new ItemResponse(
                    item.getId(),
                    item.getKind(),
                    item.getDescription(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.lineTotal());
        }
    }

    record PaymentResponse(UUID id, String method, BigDecimal amount) {
        static PaymentResponse from(SalePayment payment) {
            return new PaymentResponse(payment.getId(), payment.getMethod(), payment.getAmount());
        }
    }
}
