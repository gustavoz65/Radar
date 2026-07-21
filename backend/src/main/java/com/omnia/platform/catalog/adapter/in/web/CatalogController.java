package com.omnia.platform.catalog.adapter.in.web;

import com.omnia.platform.catalog.application.usecase.CatalogUseCases;
import com.omnia.platform.catalog.domain.model.Product;
import com.omnia.platform.catalog.domain.model.ServiceOffering;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
@Tag(name = "Catalog", description = "Sellable services and products")
class CatalogController {

    private final CatalogUseCases useCases;

    CatalogController(CatalogUseCases useCases) {
        this.useCases = useCases;
    }

    // --- services ---

    @GetMapping("/services")
    @Operation(summary = "List services (active only by default)")
    List<ServiceResponse> listServices(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return useCases.listServices(includeInactive).stream()
                .map(ServiceResponse::from)
                .toList();
    }

    @PostMapping("/services")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a service")
    ServiceResponse createService(@RequestBody @Valid ServiceRequest request) {
        return ServiceResponse.from(useCases.createService(request.toCommand()));
    }

    @PutMapping("/services/{id}")
    @Operation(summary = "Update a service")
    ServiceResponse updateService(@PathVariable UUID id, @RequestBody @Valid ServiceRequest request) {
        return ServiceResponse.from(useCases.updateService(id, request.toCommand()));
    }

    @PatchMapping("/services/{id}/active")
    @Operation(summary = "Activate or deactivate a service")
    ServiceResponse toggleService(@PathVariable UUID id, @RequestBody @Valid ToggleRequest request) {
        return ServiceResponse.from(useCases.toggleService(id, Boolean.TRUE.equals(request.active())));
    }

    // --- products ---

    @GetMapping("/products")
    @Operation(summary = "List products (active only by default)")
    List<ProductResponse> listProducts(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return useCases.listProducts(includeInactive).stream()
                .map(ProductResponse::from)
                .toList();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a product")
    ProductResponse createProduct(@RequestBody @Valid ProductRequest request) {
        return ProductResponse.from(useCases.createProduct(request.toCommand()));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update a product")
    ProductResponse updateProduct(@PathVariable UUID id, @RequestBody @Valid ProductRequest request) {
        return ProductResponse.from(useCases.updateProduct(id, request.toCommand()));
    }

    @PatchMapping("/products/{id}/active")
    @Operation(summary = "Activate or deactivate a product")
    ProductResponse toggleProduct(@PathVariable UUID id, @RequestBody @Valid ToggleRequest request) {
        return ProductResponse.from(useCases.toggleProduct(id, Boolean.TRUE.equals(request.active())));
    }

    record ToggleRequest(@NotNull Boolean active) {}

    record ServiceRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 500) String description,
            @Min(5) @Max(1440) int durationMinutes,
            @NotNull @DecimalMin("0.00") BigDecimal price) {

        CatalogUseCases.ServiceCommand toCommand() {
            return new CatalogUseCases.ServiceCommand(name, description, durationMinutes, price);
        }
    }

    record ServiceResponse(
            UUID id, String name, String description, int durationMinutes, BigDecimal price, boolean active) {

        static ServiceResponse from(ServiceOffering service) {
            return new ServiceResponse(
                    service.getId(),
                    service.getName(),
                    service.getDescription(),
                    service.getDurationMinutes(),
                    service.getPrice(),
                    service.isActive());
        }
    }

    record ProductRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 60) String sku,
            @NotNull @DecimalMin("0.00") BigDecimal price,
            @DecimalMin("0.00") BigDecimal cost) {

        CatalogUseCases.ProductCommand toCommand() {
            return new CatalogUseCases.ProductCommand(name, sku, price, cost);
        }
    }

    record ProductResponse(UUID id, String name, String sku, BigDecimal price, BigDecimal cost, boolean active) {

        static ProductResponse from(Product product) {
            return new ProductResponse(
                    product.getId(),
                    product.getName(),
                    product.getSku(),
                    product.getPrice(),
                    product.getCost(),
                    product.isActive());
        }
    }
}
