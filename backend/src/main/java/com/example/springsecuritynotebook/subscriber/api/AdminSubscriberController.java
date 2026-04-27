package com.example.springsecuritynotebook.subscriber.api;

import com.example.springsecuritynotebook.subscriber.application.SubscriberAdminService;
import com.example.springsecuritynotebook.subscriber.application.SubscriberSummaryResponse;
import com.example.springsecuritynotebook.subscriber.application.UpdateSubscriberRolesRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminSubscriberController {

    private final SubscriberAdminService subscriberAdminService;

    public AdminSubscriberController(SubscriberAdminService subscriberAdminService) {
        this.subscriberAdminService = subscriberAdminService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<SubscriberSummaryResponse> getSubscribers() {
        return subscriberAdminService.getSubscribers();
    }

    @PatchMapping("/{email}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public SubscriberSummaryResponse updateRoles(
            @PathVariable String email,
            @Valid @RequestBody UpdateSubscriberRolesRequest request
    ) {
        return subscriberAdminService.updateRoles(email, request);
    }
}
