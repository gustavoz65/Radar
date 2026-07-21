package com.omnia.platform.identity.adapter.in.web;

import com.omnia.platform.identity.application.port.out.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/members")
@Tag(name = "Members", description = "Tenant members (professionals)")
class MemberController {

    private final UserRepository users;

    MemberController(UserRepository users) {
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "List tenant members", description = "Used for professional selection in scheduling.")
    List<MemberResponse> list() {
        return users.findAllOrdered().stream()
                .filter(user -> user.isActive())
                .map(user -> new MemberResponse(user.getId(), user.getName(), user.getEmail(), user.isOwner()))
                .toList();
    }

    record MemberResponse(UUID id, String name, String email, boolean owner) {}
}
