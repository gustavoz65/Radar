package com.omnia.platform.identity.application.port.out;

import com.omnia.platform.identity.domain.model.User;
import java.util.Optional;
import java.util.UUID;

/** Persistence port of the identity module. Queries are tenant-scoped by RLS + explicit filters. */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<User> findAllOrdered();
}
