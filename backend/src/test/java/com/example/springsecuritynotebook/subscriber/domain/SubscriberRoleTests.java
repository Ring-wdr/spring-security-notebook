package com.example.springsecuritynotebook.subscriber.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SubscriberRoleTests {

  @Test
  void userRoleGrantsBasicPermissions() {
    assertThat(SubscriberRole.ROLE_USER.getPermissionNames())
        .containsExactlyInAnyOrder("ME_READ", "CONTENT_READ", "AUTH_LOGOUT");
  }

  @Test
  void managerRoleGrantsContentManagementPermissions() {
    assertThat(SubscriberRole.ROLE_MANAGER.getPermissionNames())
        .containsExactlyInAnyOrder(
            "ME_READ", "CONTENT_READ", "CONTENT_DRAFT_READ", "CONTENT_WRITE", "AUTH_LOGOUT");
  }

  @Test
  void adminRoleGrantsUserManagementPermissions() {
    assertThat(SubscriberRole.ROLE_ADMIN.getPermissionNames())
        .containsExactlyInAnyOrder(
            "ME_READ",
            "CONTENT_READ",
            "CONTENT_DRAFT_READ",
            "CONTENT_WRITE",
            "USER_READ",
            "USER_ROLE_UPDATE",
            "AUTH_LOGOUT");
  }
}
