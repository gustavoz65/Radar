package com.omnia.platform.identity.adapter.in.web;

import com.omnia.platform.identity.application.usecase.LoginUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Auth", description = "Authentication")
class AuthController {

    private final LoginUseCase login;

    AuthController(LoginUseCase login) {
        this.login = login;
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Login with tenant slug, e-mail and password", description = "Public endpoint.")
    LoginResponse login(@RequestBody @Valid LoginRequest request) {
        var result = login.execute(new LoginUseCase.Command(request.tenantSlug(), request.email(), request.password()));
        return new LoginResponse(
                result.accessToken(), result.expiresInSeconds(), result.userId(), result.userName(), result.tenantId());
    }

    @GetMapping("/me")
    @Operation(summary = "Current user profile from the access token")
    Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
                "userId", jwt.getSubject(),
                "name", String.valueOf(jwt.getClaimAsString("name")),
                "tenantId", String.valueOf(jwt.getClaimAsString("tenant_id")),
                "owner", Boolean.TRUE.equals(jwt.getClaim("owner")));
    }

    record LoginRequest(@NotBlank String tenantSlug, @NotBlank @Email String email, @NotBlank String password) {}

    record LoginResponse(String accessToken, long expiresInSeconds, UUID userId, String userName, UUID tenantId) {}
}
