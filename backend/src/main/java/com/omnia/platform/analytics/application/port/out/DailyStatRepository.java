package com.omnia.platform.analytics.application.port.out;

import com.omnia.platform.analytics.domain.model.DailyStat;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyStatRepository {

    DailyStat save(DailyStat stat);

    Optional<DailyStat> findByTenantAndDate(UUID tenantId, LocalDate date);

    List<DailyStat> findInPeriod(LocalDate from, LocalDate to);
}
