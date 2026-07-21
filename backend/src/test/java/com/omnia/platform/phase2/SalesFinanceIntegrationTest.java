package com.omnia.platform.phase2;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnia.platform.TestcontainersConfiguration;
import com.omnia.platform.onboarding.application.usecase.SignUpTenantUseCase;
import com.omnia.platform.tenant.Vertical;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Comanda → items → payment → complete, and the resulting income entry / cash-flow. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SalesFinanceIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SignUpTenantUseCase signUp;

    @Test
    void shouldSellAndGenerateIncome() throws Exception {
        signUp.execute(new SignUpTenantUseCase.Command(
                "barber-pos", "Barber POS", Vertical.BARBERSHOP, "Zé", "ze@pos.com", "super-secret-1"));
        String token = login("barber-pos", "ze@pos.com");

        String serviceId = create(
                token, "/api/v1/catalog/services", "{\"name\":\"Barba\",\"durationMinutes\":20,\"price\":\"30.00\"}");

        String saleId = create(token, "/api/v1/sales", "{}");

        mvc.perform(post("/api/v1/sales/" + saleId + "/service-items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceId\":\"%s\",\"quantity\":2}".formatted(serviceId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(60.0));

        // underpaid → cannot complete
        mvc.perform(post("/api/v1/sales/" + saleId + "/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"CASH\",\"amount\":\"40.00\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/sales/" + saleId + "/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("sale.underpaid"));

        // pay the rest and complete
        mvc.perform(post("/api/v1/sales/" + saleId + "/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"PIX\",\"amount\":\"20.00\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/sales/" + saleId + "/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        // finance received a settled income of 60 via the SaleCompleted event
        LocalDate today = LocalDate.now();
        mvc.perform(get("/api/v1/finance/cash-flow")
                        .header("Authorization", "Bearer " + token)
                        .param("from", today.toString())
                        .param("to", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.income").value(60.0))
                .andExpect(jsonPath("$.balance").value(60.0));

        // and a manual expense reduces the balance
        mvc.perform(post("/api/v1/finance/entries")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                                "{\"type\":\"EXPENSE\",\"category\":\"Aluguel\",\"description\":\"Sala\",\"amount\":\"25.00\",\"dueDate\":\"%s\"}"
                                        .formatted(today)))
                .andExpect(status().isCreated());
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
