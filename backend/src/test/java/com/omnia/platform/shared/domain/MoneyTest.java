package com.omnia.platform.shared.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class MoneyTest {

    @Test
    void shouldNormalizeScale_whenCreated() {
        assertThat(Money.brl("10").amount()).isEqualByComparingTo("10.00");
    }

    @Test
    void shouldAdd_whenSameCurrency() {
        assertThat(Money.brl("10.50").add(Money.brl("4.50"))).isEqualTo(Money.brl("15.00"));
    }

    @Test
    void shouldFail_whenCurrenciesDiffer() {
        assertThatThrownBy(() -> Money.brl("10").add(Money.of("10", "USD")))
                .isInstanceOf(DomainException.class)
                .hasMessageContaining("currencies");
    }

    @Test
    void shouldRoundHalfEven_whenMultiplying() {
        assertThat(Money.brl("10.00").multiply(new BigDecimal("0.125")).amount())
                .isEqualByComparingTo("1.25");
    }
}
