package com.omnia.platform.scheduling.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;

class AppointmentTest {

    private Appointment appointment() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        return Appointment.book(new BookingDetails(
                Ids.newId(),
                Ids.newId(),
                "Cliente",
                Ids.newId(),
                "Profissional",
                Ids.newId(),
                "Corte",
                new BigDecimal("50.00"),
                start,
                start.plus(30, ChronoUnit.MINUTES),
                null));
    }

    @Test
    void shouldStartScheduled_whenBooked() {
        assertThat(appointment().getStatus()).isEqualTo(AppointmentStatus.SCHEDULED);
    }

    @Test
    void shouldRejectPeriod_whenEndBeforeStart() {
        Instant start = Instant.now();
        assertThatThrownBy(() -> Appointment.book(new BookingDetails(
                        Ids.newId(),
                        Ids.newId(),
                        "C",
                        Ids.newId(),
                        "P",
                        Ids.newId(),
                        "S",
                        BigDecimal.TEN,
                        start,
                        start.minusSeconds(60),
                        null)))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("appointment.invalid-period");
    }

    @Test
    void shouldFollowHappyPath_scheduledToCompleted() {
        Appointment a = appointment();
        a.confirm();
        a.start();
        a.complete();
        assertThat(a.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
    }

    @Test
    void shouldRejectConfirm_whenAlreadyCompleted() {
        Appointment a = appointment();
        a.complete();
        assertThatThrownBy(a::confirm)
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("appointment.invalid-transition");
    }

    @Test
    void shouldRejectNoShow_whenInProgress() {
        Appointment a = appointment();
        a.start();
        assertThatThrownBy(a::markNoShow).isInstanceOf(DomainException.class);
    }

    @Test
    void shouldRejectReschedule_whenCancelled() {
        Appointment a = appointment();
        a.cancel();
        assertThatThrownBy(() -> a.reschedule(Instant.now(), Instant.now().plusSeconds(1800), null, null))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("appointment.not-reschedulable");
    }

    @Test
    void shouldNotOccupyAgenda_whenCancelledOrNoShow() {
        assertThat(AppointmentStatus.CANCELLED.occupiesAgenda()).isFalse();
        assertThat(AppointmentStatus.NO_SHOW.occupiesAgenda()).isFalse();
        assertThat(AppointmentStatus.CONFIRMED.occupiesAgenda()).isTrue();
    }
}
