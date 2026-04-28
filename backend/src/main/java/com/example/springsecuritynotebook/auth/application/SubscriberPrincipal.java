package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

public class SubscriberPrincipal extends User {

  private final String email;
  private final String nickname;
  private final boolean social;
  private final List<String> roleNames;

  public SubscriberPrincipal(
      String email, String password, String nickname, boolean social, List<String> roleNames) {
    super(email, password, toAuthorities(roleNames));
    this.email = email;
    this.nickname = nickname;
    this.social = social;
    this.roleNames = List.copyOf(roleNames);
  }

  public static SubscriberPrincipal from(Subscriber subscriber) {
    List<String> roleNames = subscriber.getRoleList().stream().map(SubscriberRole::name).toList();

    return new SubscriberPrincipal(
        subscriber.getEmail(),
        subscriber.getPassword(),
        subscriber.getNickname(),
        subscriber.isSocial(),
        roleNames);
  }

  public AccessTokenClaims toAccessTokenClaims() {
    return new AccessTokenClaims(email, nickname, social, roleNames);
  }

  public String getEmail() {
    return email;
  }

  public String getNickname() {
    return nickname;
  }

  public boolean isSocial() {
    return social;
  }

  public List<String> getRoleNames() {
    return roleNames;
  }

  private static Collection<? extends GrantedAuthority> toAuthorities(List<String> roleNames) {
    LinkedHashSet<String> authorityNames = new LinkedHashSet<>(roleNames);

    roleNames.stream()
        .map(SubscriberPrincipal::findRole)
        .flatMap(Optional::stream)
        .flatMap(role -> role.getPermissionNames().stream())
        .forEach(authorityNames::add);

    return authorityNames.stream().map(SimpleGrantedAuthority::new).toList();
  }

  private static Optional<SubscriberRole> findRole(String roleName) {
    try {
      return Optional.of(SubscriberRole.valueOf(roleName));
    } catch (IllegalArgumentException exception) {
      return Optional.empty();
    }
  }
}
