package com.omnia.platform.scheduling.adapter.out.persistence;

import com.omnia.platform.scheduling.application.port.out.AppointmentRepository;
import com.omnia.platform.scheduling.domain.model.Appointment;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentJpaRepository extends AppointmentRepository, JpaRepository<Appointment, UUID> {

    @Query(
            """
            SELECT a FROM Appointment a
            WHERE a.tenantId = :tenantId
              AND a.startTime < :to AND a.endTime > :from
              AND (:professionalUserId IS NULL OR a.professionalUserId = :professionalUserId)
            ORDER BY a.startTime
            """)
    List<Appointment> findInPeriodScoped(
            @Param("tenantId") UUID tenantId,
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("professionalUserId") UUID professionalUserId);

    @Query(
            """
            SELECT a FROM Appointment a
            WHERE a.tenantId = :tenantId
              AND a.professionalUserId = :professionalUserId
              AND a.status IN (com.omnia.platform.scheduling.domain.model.AppointmentStatus.SCHEDULED,
                               com.omnia.platform.scheduling.domain.model.AppointmentStatus.CONFIRMED,
                               com.omnia.platform.scheduling.domain.model.AppointmentStatus.IN_PROGRESS)
              AND a.startTime < :end AND a.endTime > :start
              AND (:excludeId IS NULL OR a.id <> :excludeId)
            """)
    List<Appointment> findConflictsScoped(
            @Param("tenantId") UUID tenantId,
            @Param("professionalUserId") UUID professionalUserId,
            @Param("start") Instant start,
            @Param("end") Instant end,
            @Param("excludeId") UUID excludeId);

    @Query(
            """
            SELECT COUNT(a) FROM Appointment a
            WHERE a.tenantId = :tenantId AND a.startTime < :to AND a.endTime > :from
            """)
    long countInPeriodScoped(@Param("tenantId") UUID tenantId, @Param("from") Instant from, @Param("to") Instant to);

    @Override
    default List<Appointment> findInPeriod(Instant from, Instant to, UUID professionalUserId) {
        return findInPeriodScoped(TenantContext.require(), from, to, professionalUserId);
    }

    @Override
    default List<Appointment> findConflicts(UUID professionalUserId, Instant start, Instant end, UUID excludeId) {
        return findConflictsScoped(TenantContext.require(), professionalUserId, start, end, excludeId);
    }

    @Override
    default long countInPeriod(Instant from, Instant to) {
        return countInPeriodScoped(TenantContext.require(), from, to);
    }
}
