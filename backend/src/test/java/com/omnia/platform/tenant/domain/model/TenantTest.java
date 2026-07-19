package com.omnia.platform.tenant.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.tenant.Vertical;
import org.junit.jupiter.api.Test;

class TenantTest {

    @Test
    void shouldStartInTrial_whenSignedUp() {
        Tenant tenant = Tenant.signUp("barber-x", "Barbearia X", Vertical.BARBERSHOP);

        assertThat(tenant.getStatus()).isEqualTo(TenantStatus.TRIAL);
        assertThat(tenant.getId()).isNotNull();
        assertThat(tenant.getLocale()).isEqualTo("pt-BR");
    }

    @Test
    void shouldRejectInvalidSlug_whenSignedUp() {
        assertThatThrownBy(() -> Tenant.signUp("Bad Slug!", "X", Vertical.GENERIC))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("tenant.invalid-slug");
    }

    @Test
    void shouldActivate_whenInTrial() {
        Tenant tenant = Tenant.signUp("clinic-y", "Clínica Y", Vertical.HEALTH_CLINIC);

        tenant.activate();

        assertThat(tenant.getStatus()).isEqualTo(TenantStatus.ACTIVE);
    }

    @Test
    void shouldRejectActivation_whenCancelled() {
        Tenant tenant = Tenant.signUp("gym-z", "Academia Z", Vertical.GYM);
        tenant.cancel();

        assertThatThrownBy(tenant::activate)
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("tenant.cancelled");
    }

    @Test
    void shouldRejectSuspension_whenCancelled() {
        Tenant tenant = Tenant.signUp("pet-w", "Petshop W", Vertical.PETSHOP);
        tenant.cancel();

        assertThatThrownBy(tenant::suspend).isInstanceOf(DomainException.class);
    }
}
