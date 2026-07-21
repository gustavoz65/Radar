package com.omnia.platform.identity.adapter.out.persistence;

import com.omnia.platform.identity.application.port.out.UserRepository;
import com.omnia.platform.identity.domain.model.User;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserJpaRepository extends UserRepository, JpaRepository<User, UUID> {

    List<User> findByTenantIdOrderByNameAsc(UUID tenantId);

    @Override
    default List<User> findAllOrdered() {
        return findByTenantIdOrderByNameAsc(TenantContext.require());
    }
}
