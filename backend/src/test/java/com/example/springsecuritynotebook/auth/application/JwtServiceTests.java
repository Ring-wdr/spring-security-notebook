package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import com.example.springsecuritynotebook.shared.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTests {

  private static final String ISSUER = "spring-security-notebook";
  private static final String SECRET = "test-only-secret-key-with-32-characters";

  private JwtService jwtService;
  private SecretKey signingKey;

  @BeforeEach
  void setUp() {
    jwtService = new JwtService(new JwtProperties(ISSUER, SECRET, 10, 1440));
    signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
  }

  @Test
  void validateAccessTokenRejectsTokenWithUnexpectedIssuer() {
    String token = buildAccessToken("other-issuer", Instant.now().plusSeconds(60));

    assertThatThrownBy(() -> jwtService.validateAccessToken(token))
        .isInstanceOf(CustomJwtException.class)
        .hasMessage("ERROR_ACCESS_TOKEN");
  }

  @Test
  void validateAccessTokenAllowsSmallClockSkew() {
    String token = buildAccessToken(ISSUER, Instant.now().minusSeconds(5));

    AccessTokenClaims claims = jwtService.validateAccessToken(token);

    assertThat(claims.email()).isEqualTo("user@example.com");
    assertThat(claims.roleNames()).containsExactly("ROLE_USER");
  }

  @Test
  void validateRefreshTokenEmailThrowsRefreshTokenErrorForMalformedToken() {
    assertThatThrownBy(() -> jwtService.validateRefreshTokenEmail("not-a-jwt"))
        .isInstanceOf(CustomJwtException.class)
        .hasMessage("ERROR_REFRESH_TOKEN");
  }

  @Test
  void validateRefreshTokenReturnsEmailAndFamilyId() {
    String token = jwtService.generateRefreshToken("user@example.com", 60);

    RefreshTokenClaims claims = jwtService.validateRefreshToken(token);

    assertThat(claims.email()).isEqualTo("user@example.com");
    assertThat(claims.familyId()).isNotBlank();
  }

  @Test
  void validateRefreshTokenRejectsTokenWithoutFamilyId() {
    String token = buildRefreshTokenWithoutFamilyId();

    assertThatThrownBy(() -> jwtService.validateRefreshToken(token))
        .isInstanceOf(CustomJwtException.class)
        .hasMessage("ERROR_REFRESH_TOKEN");
  }

  private String buildAccessToken(String issuer, Instant expiration) {
    Instant issuedAt = expiration.minusSeconds(60);
    return Jwts.builder()
        .issuer(issuer)
        .claims(
            new AccessTokenClaims("user@example.com", "user", false, List.of("ROLE_USER"))
                .toClaimsMap())
        .issuedAt(Date.from(issuedAt))
        .expiration(Date.from(expiration))
        .signWith(signingKey)
        .compact();
  }

  private String buildRefreshTokenWithoutFamilyId() {
    Instant now = Instant.now();
    return Jwts.builder()
        .issuer(ISSUER)
        .claim("email", "user@example.com")
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(60)))
        .signWith(signingKey)
        .compact();
  }
}
