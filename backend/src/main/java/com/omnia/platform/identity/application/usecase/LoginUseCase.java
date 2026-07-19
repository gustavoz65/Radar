package com.omnia.platform.identity.application.usecase;

import com.omnia.platform.identity.application.port.out.UserRepository;
import com.omnia.platform.identity.domain.model.User;
import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.tenancy.TenantContext;
import com.omnia.platform.tenant.Tenants;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * E-mail + password + tenant slug login issuing a short-lived access token (ADR-008; refresh token
 * rotation is the next Fase 0 increment).
 *
 * <p>All failure modes return the same error code so the endpoint does not leak which of
 * tenant/e-mail/password was wrong.
 */
@Service
public class LoginUseCase {

    static final Duration ACCESS_TOKEN_TTL = Duration.ofMinutes(15);
    private static final DomainException INVALID_CREDENTIALS =
            new DomainException("auth.invalid-credentials", "Invalid credentials");

    private final Tenants tenants;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final TransactionTemplate transaction;

    public LoginUseCase(
            Tenants tenants,
            UserRepository users,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            TransactionTemplate transaction) {
        this.tenants = tenants;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.transaction = transaction;
    }

    public Result execute(Command command) {
        Tenants.TenantSummary tenant = tenants.findBySlug(command.tenantSlug()).orElseThrow(() -> INVALID_CREDENTIALS);
        if ("SUSPENDED".equals(tenant.status()) || "CANCELLED".equals(tenant.status())) {
            throw new DomainException("auth.tenant-unavailable", "This account is not available");
        }

        User user = new UserHolder(tenant.id(), command).authenticate();
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("omnia")
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(now.plus(ACCESS_TOKEN_TTL))
                .claim("tenant_id", tenant.id().toString())
                .claim("name", user.getName())
                .claim("owner", user.isOwner())
                .build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
        return new Result(token, ACCESS_TOKEN_TTL.toSeconds(), user.getId(), user.getName(), tenant.id());
    }

    /** Runs the user lookup inside the tenant's context so RLS admits the query. */
    private final class UserHolder {
        private final UUID tenantId;
        private final Command command;

        private UserHolder(UUID tenantId, Command command) {
            this.tenantId = tenantId;
            this.command = command;
        }

        private User authenticate() {
            var holder = new Object() {
                User user;
            };
            TenantContext.runAs(
                    tenantId,
                    () -> transaction.executeWithoutResult(status -> holder.user = users.findByEmail(
                                    command.email().trim().toLowerCase())
                            .orElse(null)));
            User user = holder.user;
            if (user == null
                    || !user.isActive()
                    || !passwordEncoder.matches(command.password(), user.getPasswordHash())) {
                throw INVALID_CREDENTIALS;
            }
            return user;
        }
    }

    public record Command(String tenantSlug, String email, String password) {}

    public record Result(String accessToken, long expiresInSeconds, UUID userId, String userName, UUID tenantId) {}
}
