package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final JwtService jwtService;
  private final RefreshTokenStore refreshTokenStore;

  public AuthService(JwtService jwtService, RefreshTokenStore refreshTokenStore) {
    this.jwtService = jwtService;
    this.refreshTokenStore = refreshTokenStore;
  }

  public TokenPairResponse issueTokens(SubscriberPrincipal principal) {
    TokenPairResponse tokenPair = jwtService.generateTokenPair(principal);
    refreshTokenStore.store(
        principal.getEmail(), tokenPair.refreshToken(), tokenPair.refreshTokenExpiresIn());
    return tokenPair;
  }

  public TokenPairResponse refresh(String authorizationHeader, RefreshTokenRequest request) {
    String accessToken = extractBearerToken(authorizationHeader);
    Map<String, Object> accessClaims = jwtService.readClaimsAllowExpired(accessToken);
    String email = (String) accessClaims.get("email");
    if (email == null || email.isBlank()) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    String refreshEmail;
    try {
      Map<String, Object> refreshClaims = jwtService.validateToken(request.refreshToken());
      refreshEmail = (String) refreshClaims.get("email");
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

    String accessTokenValue =
        jwtService.generateAccessToken(accessClaims, jwtService.getAccessTokenExpiresInSeconds());

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

  public void logout(SubscriberPrincipal principal) {
    refreshTokenStore.invalidate(principal.getEmail());
  }

  private String extractBearerToken(String authorizationHeader) {
    if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
      throw new CustomJwtException("ERROR_ACCESS_TOKEN");
    }

    return authorizationHeader.substring(7);
  }
}
