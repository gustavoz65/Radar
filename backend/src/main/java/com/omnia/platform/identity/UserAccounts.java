package com.omnia.platform.identity;

import java.util.UUID;

/** Public API of the identity module. Callers must have bound the tenant to the context first. */
public interface UserAccounts {

    /** Creates the tenant owner account during signup. Returns the new user id. */
    UUID createOwner(UUID tenantId, String name, String email, String rawPassword);
}
