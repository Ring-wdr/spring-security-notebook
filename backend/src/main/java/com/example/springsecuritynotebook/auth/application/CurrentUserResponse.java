package com.example.springsecuritynotebook.auth.application;

import java.util.List;

public record CurrentUserResponse(
    String email, String nickname, boolean social, List<String> roleNames) {
  public static CurrentUserResponse from(SubscriberPrincipal principal) {
    return new CurrentUserResponse(
        principal.getEmail(),
        principal.getNickname(),
        principal.isSocial(),
        principal.getRoleNames());
  }
}
