package com.omnia.platform.analytics.adapter.out.persistence;

import com.omnia.platform.analytics.application.port.out.DailyStatRepository;
import com.omnia.platform.analytics.domain.model.DailyStat;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyStatJpaRepository extends DailyStatRepository, JpaRepository<DailyStat, UUID> {

    Optional<DailyStat> findByTenantIdAndStatDate(UUID tenantId, LocalDate statDate);

    List<DailyStat> findByTenantIdAndStatDateBetweenOrderByStatDate(UUID tenantId, LocalDate from, LocalDate to);

    @Override
    default Optional<DailyStat> findByTenantAndDate(UUID tenantId, LocalDate date) {
        return findByTenantIdAndStatDate(tenantId, date);
    }

    @Override
    default List<DailyStat> findInPeriod(LocalDate from, LocalDate to) {
        return findByTenantIdAndStatDateBetweenOrderByStatDate(TenantContext.require(), from, to);
    }
}
