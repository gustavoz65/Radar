package com.omnia.platform.finance.adapter.in.web;

import com.omnia.platform.finance.application.usecase.FinanceUseCases;
import com.omnia.platform.finance.application.usecase.FinanceUseCases.CashFlow;
import com.omnia.platform.finance.domain.model.Entry;
import com.omnia.platform.finance.domain.model.EntryType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/finance")
@Tag(name = "Finance", description = "Cash ledger and cash-flow")
class FinanceController {

    private final FinanceUseCases useCases;

    FinanceController(FinanceUseCases useCases) {
        this.useCases = useCases;
    }

    @GetMapping("/entries")
    @Operation(summary = "List entries in a period")
    List<EntryResponse> entries(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return useCases.list(from, to).stream().map(EntryResponse::from).toList();
    }

    @GetMapping("/cash-flow")
    @Operation(summary = "Cash-flow summary for a period")
    CashFlow cashFlow(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return useCases.cashFlow(from, to);
    }

    @PostMapping("/entries")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a manual entry (receivable or payable)")
    EntryResponse create(@RequestBody @Valid EntryRequest request) {
        return EntryResponse.from(useCases.create(
                request.type(), request.category(), request.description(), request.amount(), request.dueDate()));
    }

    @PostMapping("/entries/{id}/settle")
    @Operation(summary = "Settle an entry")
    EntryResponse settle(@PathVariable UUID id) {
        return EntryResponse.from(useCases.settle(id));
    }

    record EntryRequest(
            @NotNull EntryType type,
            @NotBlank String category,
            @NotBlank String description,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            LocalDate dueDate) {}

    record EntryResponse(
            UUID id,
            String type,
            String category,
            String description,
            BigDecimal amount,
            LocalDate dueDate,
            String status,
            String sourceType) {

        static EntryResponse from(Entry e) {
            return new EntryResponse(
                    e.getId(),
                    e.getType().name(),
                    e.getCategory(),
                    e.getDescription(),
                    e.getAmount(),
                    e.getDueDate(),
                    e.getStatus().name(),
                    e.getSourceType());
        }
    }
}
