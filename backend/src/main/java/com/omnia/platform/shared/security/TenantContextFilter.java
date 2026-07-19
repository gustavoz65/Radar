package com.omnia.platform.shared.security;

import com.omnia.platform.shared.tenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Binds the authenticated user's tenant (JWT {@code tenant_id} claim — the single source of truth,
 * never a header) to {@link TenantContext} and to the logging MDC for the request lifetime.
 */
@Component
public class TenantContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        try {
            if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
                String tenantId = jwtAuthentication.getToken().getClaimAsString("tenant_id");
                if (tenantId != null) {
                    TenantContext.set(UUID.fromString(tenantId));
                    MDC.put("tenant_id", tenantId);
                    MDC.put("user_id", jwtAuthentication.getToken().getSubject());
                }
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            MDC.remove("tenant_id");
            MDC.remove("user_id");
        }
    }
}
