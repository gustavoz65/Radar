package com.omnia.platform.onboarding.adapter.in.web;

import com.omnia.platform.onboarding.application.usecase.SignUpTenantUseCase;
import com.omnia.platform.tenant.Vertical;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants")
@Tag(name = "Tenants", description = "Tenant lifecycle")
class TenantSignupController {

    private final SignUpTenantUseCase signUp;

    TenantSignupController(SignUpTenantUseCase signUp) {
        this.signUp = signUp;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Self-service tenant signup",
            description = "Creates a tenant in TRIAL status together with its owner user account. Public endpoint.")
    SignupResponse signup(@RequestBody @Valid SignupRequest request) {
        var result = signUp.execute(new SignUpTenantUseCase.Command(
                request.slug(),
                request.companyName(),
                request.vertical(),
                request.ownerName(),
                request.ownerEmail(),
                request.ownerPassword()));
        return new SignupResponse(result.tenantId(), result.ownerUserId(), result.slug());
    }

    record SignupRequest(
            @NotBlank @Pattern(regexp = "[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?") String slug,
            @NotBlank @Size(max = 120) String companyName,
            @NotNull Vertical vertical,
            @NotBlank @Size(max = 120) String ownerName,
            @NotBlank @Email String ownerEmail,
            @NotBlank @Size(min = 10, max = 100) String ownerPassword) {}

    record SignupResponse(UUID tenantId, UUID ownerUserId, String slug) {}
}
