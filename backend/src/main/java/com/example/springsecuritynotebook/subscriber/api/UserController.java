package com.example.springsecuritynotebook.subscriber.api;

import com.example.springsecuritynotebook.auth.application.CurrentUserResponse;
import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public CurrentUserResponse getCurrentUser(@AuthenticationPrincipal SubscriberPrincipal principal) {
        return CurrentUserResponse.from(principal);
    }
}
