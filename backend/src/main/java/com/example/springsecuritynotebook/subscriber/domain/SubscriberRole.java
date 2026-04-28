package com.example.springsecuritynotebook.subscriber.domain;

import java.util.Set;
import java.util.stream.Collectors;

public enum SubscriberRole {
  ROLE_USER(
      Set.of(
          SubscriberPermission.ME_READ,
          SubscriberPermission.CONTENT_READ,
          SubscriberPermission.AUTH_LOGOUT)),
  ROLE_MANAGER(
      Set.of(
          SubscriberPermission.ME_READ,
          SubscriberPermission.CONTENT_READ,
          SubscriberPermission.CONTENT_DRAFT_READ,
          SubscriberPermission.CONTENT_WRITE,
          SubscriberPermission.AUTH_LOGOUT)),
  ROLE_ADMIN(
      Set.of(
          SubscriberPermission.ME_READ,
          SubscriberPermission.CONTENT_READ,
          SubscriberPermission.CONTENT_DRAFT_READ,
          SubscriberPermission.CONTENT_WRITE,
          SubscriberPermission.USER_READ,
          SubscriberPermission.USER_ROLE_UPDATE,
          SubscriberPermission.AUTH_LOGOUT));

  private final Set<SubscriberPermission> permissions;

  SubscriberRole(Set<SubscriberPermission> permissions) {
    this.permissions = Set.copyOf(permissions);
  }

  public Set<SubscriberPermission> getPermissions() {
    return permissions;
  }

  public Set<String> getPermissionNames() {
    return permissions.stream()
        .map(SubscriberPermission::name)
        .collect(Collectors.toUnmodifiableSet());
  }
}
