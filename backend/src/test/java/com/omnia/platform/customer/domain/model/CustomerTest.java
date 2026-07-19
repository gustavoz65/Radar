package com.omnia.platform.customer.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.domain.Ids;
import org.junit.jupiter.api.Test;

class CustomerTest {

    @Test
    void shouldNormalizeFields_whenRegistered() {
        Customer customer = Customer.register(Ids.newId(), "  Ana Souza ", " ANA@MAIL.COM ", "", null);

        assertThat(customer.getName()).isEqualTo("Ana Souza");
        assertThat(customer.getEmail()).isEqualTo("ana@mail.com");
        assertThat(customer.getPhone()).isNull();
        assertThat(customer.getStatus()).isEqualTo(CustomerStatus.ACTIVE);
    }

    @Test
    void shouldRejectBlankName_whenRegistered() {
        assertThatThrownBy(() -> Customer.register(Ids.newId(), "  ", null, null, null))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("customer.invalid-name");
    }

    @Test
    void shouldRejectInvalidEmail_whenUpdated() {
        Customer customer = Customer.register(Ids.newId(), "Ana", null, null, null);

        assertThatThrownBy(() -> customer.update("Ana", "not-an-email", null, null))
                .isInstanceOf(DomainException.class)
                .extracting("code")
                .isEqualTo("customer.invalid-email");
    }

    @Test
    void shouldArchiveAndRestore() {
        Customer customer = Customer.register(Ids.newId(), "Ana", null, null, null);

        customer.archive();
        assertThat(customer.getStatus()).isEqualTo(CustomerStatus.ARCHIVED);

        customer.restore();
        assertThat(customer.getStatus()).isEqualTo(CustomerStatus.ACTIVE);
    }
}
