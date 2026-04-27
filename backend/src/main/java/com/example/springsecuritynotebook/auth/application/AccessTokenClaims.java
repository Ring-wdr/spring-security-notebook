package com.example.springsecuritynotebook.auth.application;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public record AccessTokenClaims(
    String email, String nickname, boolean social, List<String> roleNames) {

  public AccessTokenClaims {
    roleNames = List.copyOf(roleNames);
  }

  public static AccessTokenClaims from(SubscriberPrincipal principal) {
    return new AccessTokenClaims(
        principal.getEmail(),
        principal.getNickname(),
        principal.isSocial(),
        principal.getRoleNames());
  }

  public static AccessTokenClaims from(Map<String, Object> claims) {
    return new AccessTokenClaims(
        (String) claims.get("email"),
        (String) claims.getOrDefault("nickname", ""),
        Boolean.TRUE.equals(claims.get("social")),
        extractRoleNames(claims.get("roleNames")));
  }

  public Map<String, Object> toClaimsMap() {
    Map<String, Object> claims = new LinkedHashMap<>();
    claims.put("email", email);
    claims.put("nickname", nickname);
    claims.put("social", social);
    claims.put("roleNames", roleNames);
    return claims;
  }

  public SubscriberPrincipal toPrincipal() {
    return new SubscriberPrincipal(email, "", nickname, social, roleNames);
  }

  private static List<String> extractRoleNames(Object roleNames) {
    if (roleNames instanceof List<?> values) {
      return values.stream().filter(Objects::nonNull).map(String::valueOf).toList();
    }

    return List.of();
  }
}
