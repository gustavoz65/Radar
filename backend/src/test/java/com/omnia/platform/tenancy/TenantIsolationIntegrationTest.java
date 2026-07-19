package com.omnia.platform.tenancy;

import static org.assertj.core.api.Assertions.assertThat;

import com.omnia.platform.TestcontainersConfiguration;
import com.omnia.platform.onboarding.application.usecase.SignUpTenantUseCase;
import com.omnia.platform.shared.tenancy.TenantContext;
import com.omnia.platform.tenant.Vertical;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * THE flagship test of the platform (ADR-003): proves that tenant data cannot leak across tenants,
 * with Row-Level Security enforced by a real PostgreSQL, even for queries that "forget" any WHERE
 * clause.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class TenantIsolationIntegrationTest {

    @Autowired
    private SignUpTenantUseCase signUp;

    @Autowired
    private JdbcTemplate jdbc;

    @AfterEach
    void clearContext() {
        TenantContext.clear();
    }

    @Test
    void shouldIsolateUsersBetweenTenants_evenWithoutWhereClause() {
        var barber = signUp.execute(new SignUpTenantUseCase.Command(
                "barber-a", "Barbearia A", Vertical.BARBERSHOP, "Ana", "ana@barber-a.com", "s3cret-password"));
        var clinic = signUp.execute(new SignUpTenantUseCase.Command(
                "clinic-b", "Clínica B", Vertical.HEALTH_CLINIC, "Bia", "bia@clinic-b.com", "s3cret-password"));

        TenantContext.set(barber.tenantId());
        List<Map<String, Object>> visibleToBarber = jdbc.queryForList("SELECT email FROM users");
        assertThat(visibleToBarber).extracting(row -> row.get("email")).containsExactly("ana@barber-a.com");

        TenantContext.set(clinic.tenantId());
        List<Map<String, Object>> visibleToClinic = jdbc.queryForList("SELECT email FROM users");
        assertThat(visibleToClinic).extracting(row -> row.get("email")).containsExactly("bia@clinic-b.com");
    }

    @Test
    void shouldSeeNoRows_whenNoTenantBound() {
        signUp.execute(new SignUpTenantUseCase.Command(
                "salon-c", "Salão C", Vertical.BEAUTY_SALON, "Carla", "carla@salon-c.com", "s3cret-password"));

        TenantContext.clear();
        Integer count = jdbc.queryForObject("SELECT count(*) FROM users", Integer.class);

        assertThat(count).isZero(); // fails closed: unbound context matches no rows
    }

    @Test
    void shouldRejectCrossTenantInsert_whenContextDiffers() {
        var petshop = signUp.execute(new SignUpTenantUseCase.Command(
                "pet-d", "Petshop D", Vertical.PETSHOP, "Duda", "duda@pet-d.com", "s3cret-password"));
        var gym = signUp.execute(new SignUpTenantUseCase.Command(
                "gym-e", "Academia E", Vertical.GYM, "Edu", "edu@gym-e.com", "s3cret-password"));

        TenantContext.set(gym.tenantId());
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(
                        "INSERT INTO users (id, tenant_id, name, email, password_hash) VALUES (gen_random_uuid(), ?, 'X', 'x@x.com', 'h')",
                        petshop.tenantId()))
                .rootCause() // Spring wraps the PSQLException; the RLS message lives in the root
                .hasMessageContaining("row-level security");
    }
}
