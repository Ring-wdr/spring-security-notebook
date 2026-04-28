package com.example.springsecuritynotebook.auth.application;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record CurrentUserResponse(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String email,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String nickname,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean social,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<String> roleNames) {
  public static CurrentUserResponse from(SubscriberPrincipal principal) {
    return new CurrentUserResponse(
        principal.getEmail(),
        principal.getNickname(),
        principal.isSocial(),
        principal.getRoleNames());
  }
}
