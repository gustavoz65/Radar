package com.omnia.platform.analytics.adapter.in.web;

import com.omnia.platform.analytics.application.port.out.DailyStatRepository;
import com.omnia.platform.analytics.domain.model.DailyStat;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "Read-model reports")
class AnalyticsController {

    private final DailyStatRepository stats;

    AnalyticsController(DailyStatRepository stats) {
        this.stats = stats;
    }

    @GetMapping("/summary")
    @Transactional(readOnly = true)
    @Operation(summary = "Daily series and totals for a period")
    Summary summary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<DailyStat> series = stats.findInPeriod(from, to);
        int totalAppointments =
                series.stream().mapToInt(DailyStat::getAppointments).sum();
        BigDecimal totalRevenue = series.stream().map(DailyStat::getRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        List<DayPoint> points = series.stream()
                .map(s -> new DayPoint(s.getStatDate(), s.getAppointments(), s.getRevenue()))
                .toList();
        return new Summary(totalAppointments, totalRevenue, points);
    }

    record Summary(int totalAppointments, BigDecimal totalRevenue, List<DayPoint> series) {}

    record DayPoint(LocalDate date, int appointments, BigDecimal revenue) {}
}
