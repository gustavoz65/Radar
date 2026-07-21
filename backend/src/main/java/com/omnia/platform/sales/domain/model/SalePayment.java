package com.omnia.platform.sales.domain.model;

import com.omnia.platform.shared.domain.Ids;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A payment applied to a sale (cash, card, pix...). Multiple payments per sale are allowed. */
@Entity
@Table(name = "sale_payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SalePayment {

    @Id
    private UUID id;

    @Column(name = "sale_id", nullable = false)
    private UUID saleId;

    @Column(nullable = false)
    private String method;

    @Column(nullable = false)
    private BigDecimal amount;

    SalePayment(UUID saleId, String method, BigDecimal amount) {
        this.id = Ids.newId();
        this.saleId = saleId;
        this.method = method;
        this.amount = amount;
    }
}
