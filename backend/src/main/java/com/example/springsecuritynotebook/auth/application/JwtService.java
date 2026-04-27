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

    String accessToken = generateAccessToken(principal.getClaims(), accessTokenExpiresIn);
    String refreshToken = generateRefreshToken(principal.getEmail(), refreshTokenExpiresIn);

    return new TokenPairResponse(
        "Bearer", accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn);
  }

  public Map<String, Object> validateToken(String token) {
    Claims claims;
    try {
      claims = parseClaims(token);
    } catch (JwtException | IllegalArgumentException exception) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    return sanitizeClaims(claims);
  }

  public Map<String, Object> readClaimsAllowExpired(String token) {
    try {
      return validateToken(token);
    } catch (CustomJwtException ignored) {
      try {
        Claims expiredClaims =
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
        return sanitizeClaims(expiredClaims);
      } catch (ExpiredJwtException exception) {
        return sanitizeClaims(exception.getClaims());
      } catch (JwtException | IllegalArgumentException exception) {
        throw new CustomJwtException("ERROR_ACCESS_TOKEN");
      }
    }
  }

  public String generateAccessToken(Map<String, Object> claims, long expiresInSeconds) {
    return generateToken(claims, expiresInSeconds);
  }

  public String generateRefreshToken(String email, long expiresInSeconds) {
    return generateToken(Map.of("email", email), expiresInSeconds);
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
