package com.omnia.platform.phase1;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnia.platform.TestcontainersConfiguration;
import com.omnia.platform.onboarding.application.usecase.SignUpTenantUseCase;
import com.omnia.platform.tenant.Vertical;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Covers tenant settings (with vertical preset) and the event-driven notification + audit trail. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SettingsNotificationAuditIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SignUpTenantUseCase signUp;

    @Test
    void shouldSeedSettingsFromVerticalPresetAndUpdate() throws Exception {
        signUp.execute(new SignUpTenantUseCase.Command(
                "vet-clinic", "Vet Clinic", Vertical.PETSHOP, "Dra", "dra@vet.com", "super-secret-1"));
        String token = login("vet-clinic", "dra@vet.com");

        // petshop preset → customer term "Tutor"
        mvc.perform(get("/api/v1/tenant/settings").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerTerm").value("Tutor"))
                .andExpect(jsonPath("$.openingHour").value(9));

        mvc.perform(
                        put("/api/v1/tenant/settings")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"brandColor":"#0ea5e9","logoUrl":null,"defaultTheme":"dark","openingHour":8,"closingHour":20,"customerTerm":"Tutor"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brandColor").value("#0ea5e9"))
                .andExpect(jsonPath("$.defaultTheme").value("dark"));

        mvc.perform(
                        put("/api/v1/tenant/settings")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"brandColor":"notacolor","defaultTheme":"dark","openingHour":8,"closingHour":20,"customerTerm":"Tutor"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldNotifyAndAuditWhenAppointmentBooked() throws Exception {
        var tenant = signUp.execute(new SignUpTenantUseCase.Command(
                "spa-zen", "Spa Zen", Vertical.AESTHETIC_CLINIC, "Lia", "lia@spa.com", "super-secret-1"));
        String token = login("spa-zen", "lia@spa.com");

        String customerId = create(token, "/api/v1/customers", "{\"name\":\"Bruno\"}");
        String serviceId = create(
                token,
                "/api/v1/catalog/services",
                "{\"name\":\"Massagem\",\"durationMinutes\":60,\"price\":\"120.00\"}");
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);

        mvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                """
                                {"customerId":"%s","professionalUserId":"%s","serviceId":"%s","startTime":"%s"}
                                """
                                        .formatted(customerId, tenant.ownerUserId(), serviceId, start)))
                .andExpect(status().isCreated());

        // AFTER_COMMIT listeners run synchronously → notification + audit already persisted
        mvc.perform(get("/api/v1/notifications").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unread").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Novo agendamento"));

        mvc.perform(get("/api/v1/audit").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("appointment.booked"));
    }

    private String login(String slug, String email) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenantSlug\":\"%s\",\"email\":\"%s\",\"password\":\"super-secret-1\"}"
                                .formatted(slug, email)))
                .andReturn();
        return objectMapper
                .readTree(result.getResponse().getContentAsString())
                .get("accessToken")
                .asText();
    }

    private String create(String token, String path, String body) throws Exception {
        var result = mvc.perform(post(path)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper
                .readTree(result.getResponse().getContentAsString())
                .get("id")
                .asText();
    }
}
