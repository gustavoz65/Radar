package com.omnia.platform.analytics.application;

import com.omnia.platform.analytics.application.port.out.DailyStatRepository;
import com.omnia.platform.analytics.domain.model.DailyStat;
import com.omnia.platform.sales.SaleCompleted;
import com.omnia.platform.scheduling.AppointmentBooked;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/** Builds the daily read-model from other modules' events (ADR-006). */
@Component
class AnalyticsProjector {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    private final DailyStatRepository stats;

    AnalyticsProjector(DailyStatRepository stats) {
        this.stats = stats;
    }

    @TransactionalEventListener
    @Transactional
    void onAppointmentBooked(AppointmentBooked event) {
        apply(event.tenantId(), event.startTime().atZone(ZONE).toLocalDate(), DailyStat::addAppointment);
    }

    @TransactionalEventListener
    @Transactional
    void onSaleCompleted(SaleCompleted event) {
        apply(event.tenantId(), event.completedAt().atZone(ZONE).toLocalDate(), stat -> stat.addRevenue(event.total()));
    }

    private void apply(UUID tenantId, LocalDate date, Consumer<DailyStat> mutation) {
        TenantContext.runAs(tenantId, () -> {
            DailyStat stat = stats.findByTenantAndDate(tenantId, date).orElseGet(() -> DailyStat.empty(tenantId, date));
            mutation.accept(stat);
            stats.save(stat);
        });
    }
}
