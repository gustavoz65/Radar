package com.omnia.platform.finance.adapter.out.persistence;

import com.omnia.platform.finance.application.port.out.EntryRepository;
import com.omnia.platform.finance.domain.model.Entry;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntryJpaRepository extends EntryRepository, JpaRepository<Entry, UUID> {

    List<Entry> findByTenantIdAndDueDateBetweenOrderByDueDateDesc(UUID tenantId, LocalDate from, LocalDate to);

    @Override
    default List<Entry> findInPeriod(LocalDate from, LocalDate to) {
        return findByTenantIdAndDueDateBetweenOrderByDueDateDesc(TenantContext.require(), from, to);
    }
}
