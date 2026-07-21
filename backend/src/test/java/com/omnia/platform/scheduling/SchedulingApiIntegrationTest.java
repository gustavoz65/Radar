package com.omnia.platform.scheduling;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

/** Booking flow: customer + service + booking, conflict detection and status transitions. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SchedulingApiIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SignUpTenantUseCase signUp;

    @Test
    void shouldBookDetectConflictsAndTransition() throws Exception {
        var tenant = signUp.execute(new SignUpTenantUseCase.Command(
                "barber-sched", "Barber Sched", Vertical.BARBERSHOP, "Dono", "dono@sched.com", "super-secret-1"));
        String token = login("barber-sched", "dono@sched.com");

        String customerId = createJson(token, "/api/v1/customers", "{\"name\":\"Zeca\",\"phone\":\"11 98888-7777\"}");
        String serviceId = createJson(
                token, "/api/v1/catalog/services", "{\"name\":\"Corte\",\"durationMinutes\":30,\"price\":\"50.00\"}");
        String professionalId = tenant.ownerUserId().toString();

        Instant start = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        String bookBody =
                """
                {"customerId":"%s","professionalUserId":"%s","serviceId":"%s","startTime":"%s"}
                """
                        .formatted(customerId, professionalId, serviceId, start);

        var booked = mvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.serviceName").value("Corte"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andReturn();
        String appointmentId = objectMapper
                .readTree(booked.getResponse().getContentAsString())
                .get("id")
                .asText();

        // same professional, overlapping slot (15 min later) → 422 appointment.overlap
        String overlapping =
                """
                {"customerId":"%s","professionalUserId":"%s","serviceId":"%s","startTime":"%s"}
                """
                        .formatted(customerId, professionalId, serviceId, start.plus(15, ChronoUnit.MINUTES));
        mvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(overlapping))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("appointment.overlap"));

        // agenda of the day contains it
        mvc.perform(get("/api/v1/appointments")
                        .header("Authorization", "Bearer " + token)
                        .param("from", start.minus(1, ChronoUnit.HOURS).toString())
                        .param("to", start.plus(2, ChronoUnit.HOURS).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerName").value("Zeca"));

        // transitions: confirm → complete; then cancel is invalid (422)
        mvc.perform(post("/api/v1/appointments/" + appointmentId + "/transitions/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        mvc.perform(post("/api/v1/appointments/" + appointmentId + "/transitions/complete")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        mvc.perform(post("/api/v1/appointments/" + appointmentId + "/transitions/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("appointment.invalid-transition"));

        // after completion the slot is free again
        mvc.perform(post("/api/v1/appointments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bookBody))
                .andExpect(status().isCreated());
    }

    private String login(String slug, String email) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tenantSlug\":\"%s\",\"email\":\"%s\",\"password\":\"super-secret-1\"}"
                                .formatted(slug, email)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper
                .readTree(result.getResponse().getContentAsString())
                .get("accessToken")
                .asText();
    }

    private String createJson(String token, String path, String body) throws Exception {
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
