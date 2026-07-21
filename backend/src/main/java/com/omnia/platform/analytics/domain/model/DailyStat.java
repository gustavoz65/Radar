package com.omnia.platform.analytics.domain.model;

import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Denormalized per-day aggregate for a tenant. One row per (tenant, date). */
@Entity
@Table(name = "analytics_daily_stats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyStat {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "stat_date", nullable = false, updatable = false)
    private LocalDate statDate;

    @Column(nullable = false)
    private int appointments;

    @Column(nullable = false)
    private BigDecimal revenue;

    @Version
    private long version;

    private DailyStat(UUID tenantId, LocalDate statDate) {
        this.id = Ids.newId();
        this.tenantId = tenantId;
        this.statDate = statDate;
        this.appointments = 0;
        this.revenue = BigDecimal.ZERO;
    }

    public static DailyStat empty(UUID tenantId, LocalDate statDate) {
        return new DailyStat(tenantId, statDate);
    }

    public void addAppointment() {
        this.appointments += 1;
    }

    public void addRevenue(BigDecimal amount) {
        this.revenue = this.revenue.add(amount);
    }
}
