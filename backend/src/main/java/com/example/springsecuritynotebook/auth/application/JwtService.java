package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import com.example.springsecuritynotebook.shared.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final JwtProperties jwtProperties;
  private final SecretKey signingKey;

  public JwtService(JwtProperties jwtProperties) {
    this.jwtProperties = jwtProperties;
    this.signingKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
  }

  public TokenPairResponse generateTokenPair(SubscriberPrincipal principal) {
    long accessTokenExpiresIn = jwtProperties.accessTokenMinutes() * 60L;
    long refreshTokenExpiresIn = jwtProperties.refreshTokenMinutes() * 60L;

    String accessToken = generateAccessToken(principal.toAccessTokenClaims(), accessTokenExpiresIn);
    String refreshToken = generateRefreshToken(principal.getEmail(), refreshTokenExpiresIn);

    return new TokenPairResponse(
        "Bearer", accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn);
  }

  public AccessTokenClaims validateAccessToken(String token) {
    Claims claims;
    try {
      claims = parseClaims(token);
    } catch (JwtException | IllegalArgumentException exception) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    return AccessTokenClaims.from(sanitizeClaims(claims));
  }

  public AccessTokenClaims readAccessClaimsAllowExpired(String token) {
    try {
      return validateAccessToken(token);
    } catch (CustomJwtException ignored) {
      try {
        Claims expiredClaims =
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
        return AccessTokenClaims.from(sanitizeClaims(expiredClaims));
      } catch (ExpiredJwtException exception) {
        return AccessTokenClaims.from(sanitizeClaims(exception.getClaims()));
      } catch (JwtException | IllegalArgumentException exception) {
        throw new CustomJwtException("ERROR_ACCESS_TOKEN");
      }
    }
  }

  public String generateAccessToken(AccessTokenClaims claims, long expiresInSeconds) {
    return generateToken(claims.toClaimsMap(), expiresInSeconds);
  }

  public String generateRefreshToken(String email, long expiresInSeconds) {
    return generateToken(Map.of("email", email), expiresInSeconds);
  }

  public String validateRefreshTokenEmail(String token) {
    Claims claims;
    try {
      claims = parseClaims(token);
    } catch (JwtException | IllegalArgumentException exception) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    return (String) claims.get("email");
  }

  public long getAccessTokenExpiresInSeconds() {
    return jwtProperties.accessTokenMinutes() * 60L;
  }

  public long getRefreshTokenExpiresInSeconds() {
    return jwtProperties.refreshTokenMinutes() * 60L;
  }

  public long getRemainingLifetimeSeconds(String token) {
    Claims claims;
    try {
      claims = parseClaims(token);
    } catch (JwtException | IllegalArgumentException exception) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    long remainingSeconds =
        claims.getExpiration().toInstant().getEpochSecond() - Instant.now().getEpochSecond();
    return Math.max(remainingSeconds, 0L);
  }

  private Claims parseClaims(String token) {
    return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
  }

  private Map<String, Object> sanitizeClaims(Claims claims) {
    Map<String, Object> result = new LinkedHashMap<>(claims);
    result.remove("exp");
    result.remove("iat");
    result.remove("iss");
    return result;
  }

  private String generateToken(Map<String, Object> claims, long expiresInSeconds) {
    Instant now = Instant.now();
    Instant expiration = now.plusSeconds(expiresInSeconds);

    return Jwts.builder()
        .issuer(jwtProperties.issuer())
        .id(UUID.randomUUID().toString())
        .claims(new LinkedHashMap<>(claims))
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiration))
        .signWith(signingKey)
        .compact();
  }
}
