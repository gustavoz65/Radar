package com.omnia.platform.identity.application.usecase;

import com.omnia.platform.identity.Members;
import com.omnia.platform.identity.application.port.out.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class MembersService implements Members {

    private final UserRepository users;

    MembersService(UserRepository users) {
        this.users = users;
    }

    @Override
    public Optional<MemberSummary> findActiveById(UUID id) {
        return users.findById(id)
                .filter(user -> user.isActive())
                .map(user -> new MemberSummary(user.getId(), user.getName()));
    }
}
