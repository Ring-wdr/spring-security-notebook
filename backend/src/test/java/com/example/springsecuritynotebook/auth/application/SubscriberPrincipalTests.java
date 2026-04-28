package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

class SubscriberPrincipalTests {

  @Test
  void principalKeepsRoleAuthorityAndAddsPermissionAuthorities() {
    SubscriberPrincipal principal =
        new SubscriberPrincipal(
            "manager@example.com", "", "manager", false, java.util.List.of("ROLE_MANAGER"));

    assertThat(principal.getAuthorities())
        .extracting(GrantedAuthority::getAuthority)
        .containsExactlyInAnyOrder(
            "ROLE_MANAGER",
            "ME_READ",
            "CONTENT_READ",
            "CONTENT_DRAFT_READ",
            "CONTENT_WRITE",
            "AUTH_LOGOUT");
  }

  @Test
  void principalDoesNotGrantAuthoritiesFromUnknownRoleOrRawPermissionNames() {
    SubscriberPrincipal principal =
        new SubscriberPrincipal(
            "legacy@example.com",
            "",
            "legacy",
            false,
            java.util.List.of("ROLE_LEGACY", "CONTENT_WRITE"));

    assertThat(principal.getAuthorities()).extracting(GrantedAuthority::getAuthority).isEmpty();
  }
}
