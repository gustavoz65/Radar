package com.omnia.platform.finance.application;

import com.omnia.platform.finance.application.usecase.FinanceUseCases;
import com.omnia.platform.sales.SaleCompleted;
import com.omnia.platform.shared.tenancy.TenantContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/** Turns a completed sale into a settled income entry (eventual consistency, ADR-006). */
@Component
class SalesEventListener {

    private final FinanceUseCases finance;

    SalesEventListener(FinanceUseCases finance) {
        this.finance = finance;
    }

    @TransactionalEventListener
    void onSaleCompleted(SaleCompleted event) {
        String description = event.customerName() == null ? "Venda avulsa" : "Venda — " + event.customerName();
        TenantContext.runAs(
                event.tenantId(),
                () -> finance.recordSaleIncome(event.tenantId(), event.saleId(), description, event.total()));
    }
}
