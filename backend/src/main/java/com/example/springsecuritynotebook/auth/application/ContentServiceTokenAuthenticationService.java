package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.auth.config.ContentServiceTokenProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Optional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ContentServiceTokenAuthenticationService {

  private static final int MIN_TOKEN_LENGTH = 32;
  private static final String PUBLISHED_SERVICE_PRINCIPAL = "content-published-service";
  private static final String MANAGEMENT_SERVICE_PRINCIPAL = "content-management-service";
  private static final List<SimpleGrantedAuthority> PUBLISHED_AUTHORITIES =
      List.of(new SimpleGrantedAuthority("CONTENT_READ"));
  private static final List<SimpleGrantedAuthority> MANAGEMENT_AUTHORITIES =
      List.of(
          new SimpleGrantedAuthority("CONTENT_READ"),
          new SimpleGrantedAuthority("CONTENT_DRAFT_READ"));

  private final ContentServiceTokenProperties properties;

  public ContentServiceTokenAuthenticationService(ContentServiceTokenProperties properties) {
    this.properties = properties;
    validateConfiguredToken("app.service-tokens.content.published", properties.published());
    validateConfiguredToken("app.service-tokens.content.management", properties.management());
  }

  public Optional<Authentication> authenticate(String token) {
    if (matchesConfiguredToken(token, properties.published())) {
      return Optional.of(createAuthentication(PUBLISHED_SERVICE_PRINCIPAL, PUBLISHED_AUTHORITIES));
    }

    if (matchesConfiguredToken(token, properties.management())) {
      return Optional.of(
          createAuthentication(MANAGEMENT_SERVICE_PRINCIPAL, MANAGEMENT_AUTHORITIES));
    }

    return Optional.empty();
  }

  private Authentication createAuthentication(
      String username, List<SimpleGrantedAuthority> authorities) {
    User principal = new User(username, "", authorities);
    return new UsernamePasswordAuthenticationToken(principal, null, authorities);
  }

  private boolean matchesConfiguredToken(String token, String configuredToken) {
    if (!StringUtils.hasText(token) || !StringUtils.hasText(configuredToken)) {
      return false;
    }

    byte[] tokenBytes = token.getBytes(StandardCharsets.UTF_8);
    byte[] configuredTokenBytes = configuredToken.getBytes(StandardCharsets.UTF_8);
    return MessageDigest.isEqual(tokenBytes, configuredTokenBytes);
  }

  private void validateConfiguredToken(String propertyName, String configuredToken) {
    if (!StringUtils.hasText(configuredToken)) {
      return;
    }

    if (configuredToken.length() < MIN_TOKEN_LENGTH) {
      throw new IllegalStateException(
          propertyName + " must be at least " + MIN_TOKEN_LENGTH + " characters when configured");
    }
  }
}
