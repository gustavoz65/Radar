package com.omnia.platform.onboarding;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnia.platform.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** End-to-end happy path of Fase 0: signup → login → authenticated /me. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SignupAndLoginIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldSignupLoginAndFetchProfile() throws Exception {
        mvc.perform(
                        post("/api/v1/tenants/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {
                                  "slug": "studio-glow",
                                  "companyName": "Studio Glow",
                                  "vertical": "AESTHETIC_CLINIC",
                                  "ownerName": "Marina Lopes",
                                  "ownerEmail": "marina@studioglow.com",
                                  "ownerPassword": "super-secret-1"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId").exists())
                .andExpect(jsonPath("$.slug").value("studio-glow"));

        var loginResult = mvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"tenantSlug": "studio-glow", "email": "marina@studioglow.com", "password": "super-secret-1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn();

        JsonNode login = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = login.get("accessToken").asText();

        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Marina Lopes"))
                .andExpect(jsonPath("$.owner").value(true));
    }

    @Test
    void shouldRejectLogin_whenWrongPassword() throws Exception {
        mvc.perform(
                        post("/api/v1/tenants/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {
                                  "slug": "oficina-top",
                                  "companyName": "Oficina Top",
                                  "vertical": "AUTO_REPAIR",
                                  "ownerName": "Rui",
                                  "ownerEmail": "rui@oficinatop.com",
                                  "ownerPassword": "super-secret-1"
                                }
                                """))
                .andExpect(status().isCreated());

        mvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"tenantSlug": "oficina-top", "email": "rui@oficinatop.com", "password": "wrong"}
                                """))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("auth.invalid-credentials"));
    }

    @Test
    void shouldRequireAuthentication_forProtectedEndpoints() throws Exception {
        mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
    }
}
