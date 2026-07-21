package com.omnia.platform.finance.application.usecase;

import com.omnia.platform.finance.application.port.out.EntryRepository;
import com.omnia.platform.finance.domain.model.Entry;
import com.omnia.platform.finance.domain.model.EntryStatus;
import com.omnia.platform.finance.domain.model.EntryType;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinanceUseCases {

    private final EntryRepository entries;

    public FinanceUseCases(EntryRepository entries) {
        this.entries = entries;
    }

    @Transactional
    public Entry create(EntryType type, String category, String description, BigDecimal amount, LocalDate dueDate) {
        return entries.save(Entry.manual(TenantContext.require(), type, category, description, amount, dueDate));
    }

    @Transactional
    public void recordSaleIncome(UUID tenantId, UUID saleId, String description, BigDecimal amount) {
        entries.save(Entry.fromSale(tenantId, saleId, description, amount));
    }

    @Transactional
    public Entry settle(UUID id) {
        Entry entry = entries.findById(id)
                .filter(e -> e.getTenantId().equals(TenantContext.require()))
                .orElseThrow(() -> new NotFoundException("entry.not-found", "Entry not found"));
        entry.settle();
        return entries.save(entry);
    }

    @Transactional(readOnly = true)
    public List<Entry> list(LocalDate from, LocalDate to) {
        return entries.findInPeriod(from, to);
    }

    @Transactional(readOnly = true)
    public CashFlow cashFlow(LocalDate from, LocalDate to) {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;
        for (Entry entry : entries.findInPeriod(from, to)) {
            if (entry.getStatus() == EntryStatus.SETTLED) {
                if (entry.getType() == EntryType.INCOME) {
                    income = income.add(entry.getAmount());
                } else {
                    expense = expense.add(entry.getAmount());
                }
            } else {
                pending = pending.add(entry.getAmount());
            }
        }
        return new CashFlow(income, expense, income.subtract(expense), pending);
    }

    public record CashFlow(BigDecimal income, BigDecimal expense, BigDecimal balance, BigDecimal pending) {}
}
