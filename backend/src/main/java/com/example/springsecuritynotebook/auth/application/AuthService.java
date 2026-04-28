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

    String storedRefreshToken =
        refreshTokenStore
            .get(email)
            .orElseThrow(() -> new CustomJwtException("ERROR_REFRESH_TOKEN"));

    if (!storedRefreshToken.equals(request.refreshToken())) {
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

    long remainingTtl = refreshTokenStore.getRemainingTtl(email);
    String refreshTokenValue = request.refreshToken();
    long refreshTokenExpiresIn = remainingTtl;

    if (refreshTokenStore.shouldReissue(email)) {
      refreshTokenValue =
          jwtService.generateRefreshToken(email, jwtService.getRefreshTokenExpiresInSeconds());
      refreshTokenExpiresIn = jwtService.getRefreshTokenExpiresInSeconds();
      refreshTokenStore.store(email, refreshTokenValue, refreshTokenExpiresIn);
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
    refreshTokenStore.invalidate(principal.getEmail());
    try {
      accessTokenBlocklist.revoke(accessToken, jwtService.getRemainingLifetimeSeconds(accessToken));
    } catch (CustomJwtException ignored) {
      // The refresh token must still be invalidated even if the access token is at expiry boundary.
    }
  }

  private String extractBearerToken(String authorizationHeader) {
    if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    return authorizationHeader.substring(7);
  }
}
