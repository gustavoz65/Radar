package com.omnia.platform.customer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnia.platform.TestcontainersConfiguration;
import com.omnia.platform.onboarding.application.usecase.SignUpTenantUseCase;
import com.omnia.platform.tenant.Vertical;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** Customer CRUD through the API, proving tenant scoping end to end (JWT → context → RLS). */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class CustomerApiIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SignUpTenantUseCase signUp;

    private String loginToken(String slug, String email) throws Exception {
        signUp.execute(new SignUpTenantUseCase.Command(
                slug, "Empresa " + slug, Vertical.BEAUTY_SALON, "Owner", email, "super-secret-1"));
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

    @Test
    void shouldCrudCustomers_andScopeThemByTenant() throws Exception {
        String tokenA = loginToken("salon-alfa", "a@alfa.com");
        String tokenB = loginToken("salon-beta", "b@beta.com");

        var created = mvc.perform(post("/api/v1/customers")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Carla Dias\",\"email\":\"carla@mail.com\",\"phone\":\"11 99999-0000\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Carla Dias"))
                .andReturn();
        String customerId = objectMapper
                .readTree(created.getResponse().getContentAsString())
                .get("id")
                .asText();

        // tenant A finds it by search
        mvc.perform(get("/api/v1/customers?q=carla").header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Carla Dias"))
                .andExpect(jsonPath("$.page.totalElements").value(1));

        // tenant B sees an empty base and cannot fetch A's customer by id
        mvc.perform(get("/api/v1/customers").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(0));
        mvc.perform(get("/api/v1/customers/" + customerId).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // archive hides from default listing but keeps the record
        mvc.perform(delete("/api/v1/customers/" + customerId).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/customers").header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$.page.totalElements").value(0));
        mvc.perform(get("/api/v1/customers?includeArchived=true").header("Authorization", "Bearer " + tokenA))
                .andExpect(jsonPath("$.page.totalElements").value(1));
    }

    @Test
    void shouldRejectUnauthenticatedAccess() throws Exception {
        mvc.perform(get("/api/v1/customers")).andExpect(status().isUnauthorized());
    }
}
