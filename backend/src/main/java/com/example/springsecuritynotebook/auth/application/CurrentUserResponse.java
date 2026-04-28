package com.example.springsecuritynotebook.auth.application;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record CurrentUserResponse(
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Authenticated user's email.",
            example = "user@example.com")
        String email,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Nickname exposed to the client.",
            example = "security-user")
        String nickname,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Whether the account was created through a social login flow.",
            example = "false")
        boolean social,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Granted Spring Security roles for the current user.",
            example = "[\"ROLE_USER\"]")
        List<String> roleNames) {
  public static CurrentUserResponse from(SubscriberPrincipal principal) {
    return new CurrentUserResponse(
        principal.getEmail(),
        principal.getNickname(),
        principal.isSocial(),
        principal.getRoleNames());
  }
}
