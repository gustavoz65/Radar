package com.omnia.platform.identity.application.usecase;

import com.omnia.platform.identity.UserAccounts;
import com.omnia.platform.identity.application.port.out.UserRepository;
import com.omnia.platform.identity.domain.model.User;
import com.omnia.platform.shared.domain.DomainException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class UserAccountsService implements UserAccounts {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    UserAccountsService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UUID createOwner(UUID tenantId, String name, String email, String rawPassword) {
        if (!TenantContext.require().equals(tenantId)) {
            throw new IllegalStateException("Tenant context does not match the target tenant");
        }
        if (users.existsByEmail(email.trim().toLowerCase())) {
            throw new DomainException("user.email-taken", "E-mail already registered for this tenant");
        }
        User owner = User.owner(tenantId, name, email, passwordEncoder.encode(rawPassword));
        return users.save(owner).getId();
    }
}
