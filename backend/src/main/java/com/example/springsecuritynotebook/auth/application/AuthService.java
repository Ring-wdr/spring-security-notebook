package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import com.example.springsecuritynotebook.subscriber.application.SubscriberUserLookup;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final JwtService jwtService;
  private final RefreshTokenStore refreshTokenStore;
  private final AccessTokenBlocklist accessTokenBlocklist;
  private final SubscriberUserLookup subscriberUserLookup;

  public AuthService(
      JwtService jwtService,
      RefreshTokenStore refreshTokenStore,
      AccessTokenBlocklist accessTokenBlocklist,
      SubscriberUserLookup subscriberUserLookup) {
    this.jwtService = jwtService;
    this.refreshTokenStore = refreshTokenStore;
    this.accessTokenBlocklist = accessTokenBlocklist;
    this.subscriberUserLookup = subscriberUserLookup;
  }

  public TokenPairResponse issueTokens(SubscriberPrincipal principal) {
    TokenPairResponse tokenPair = jwtService.generateTokenPair(principal);
    refreshTokenStore.store(
        principal.getEmail(), tokenPair.refreshToken(), tokenPair.refreshTokenExpiresIn());
    return tokenPair;
  }

  public TokenPairResponse refresh(String authorizationHeader, RefreshTokenRequest request) {
    String accessToken = extractBearerToken(authorizationHeader);
    if (accessTokenBlocklist.isRevoked(accessToken)) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    AccessTokenClaims accessClaims = jwtService.readAccessClaimsAllowExpired(accessToken);
    String email = accessClaims.email();
    if (email == null || email.isBlank()) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    String refreshEmail;
    try {
      refreshEmail = jwtService.validateRefreshTokenEmail(request.refreshToken());
    } catch (CustomJwtException exception) {
      throw new CustomJwtException("ERROR_REFRESH_TOKEN");
    }

    if (!email.equals(refreshEmail)) {
      throw new CustomJwtException("ERROR_REFRESH_TOKEN");
    }

    Subscriber subscriber =
        subscriberUserLookup
            .findByEmail(email)
            .orElseThrow(() -> new CustomJwtException("ERROR_ACCESS_TOKEN"));
    AccessTokenClaims refreshedClaims = SubscriberPrincipal.from(subscriber).toAccessTokenClaims();

    String accessTokenValue =
        jwtService.generateAccessToken(
            refreshedClaims, jwtService.getAccessTokenExpiresInSeconds());
    String refreshTokenValue =
        jwtService.generateRefreshToken(email, jwtService.getRefreshTokenExpiresInSeconds());
    long refreshTokenExpiresIn = jwtService.getRefreshTokenExpiresInSeconds();
    if (!refreshTokenStore.rotateIfMatches(
        email, request.refreshToken(), refreshTokenValue, refreshTokenExpiresIn)) {
      refreshTokenValue =
          refreshTokenStore
              .findRetrySuccessor(email, request.refreshToken())
              .orElseThrow(() -> new CustomJwtException("ERROR_REFRESH_TOKEN"));
      refreshTokenExpiresIn = refreshTokenStore.getRemainingTtl(email);
      if (refreshTokenExpiresIn <= 0) {
        throw new CustomJwtException("ERROR_REFRESH_TOKEN");
      }
    }

    return new TokenPairResponse(
        "Bearer",
        accessTokenValue,
        refreshTokenValue,
        jwtService.getAccessTokenExpiresInSeconds(),
        refreshTokenExpiresIn);
  }

  public void logout(SubscriberPrincipal principal, String authorizationHeader) {
    String accessToken = extractBearerToken(authorizationHeader);
    try {
      accessTokenBlocklist.revoke(accessToken, jwtService.getRemainingLifetimeSeconds(accessToken));
    } catch (CustomJwtException ignored) {
      // Refresh token invalidation should still happen even when access token expiry is ambiguous.
    }
    refreshTokenStore.invalidate(principal.getEmail());
  }

  private String extractBearerToken(String authorizationHeader) {
    if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    return authorizationHeader.substring(7);
  }
}
