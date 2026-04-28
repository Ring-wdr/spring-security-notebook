package com.example.springsecuritynotebook.auth.application;

import io.swagger.v3.oas.annotations.media.Schema;

public record TokenPairResponse(
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Token scheme used by protected API requests.",
            example = "Bearer")
        String grantType,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Short-lived JWT access token for API authorization.",
            example = "eyJhbGciOiJIUzI1NiJ9.access.payload")
        String accessToken,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Longer-lived JWT refresh token used to rotate access tokens.",
            example = "eyJhbGciOiJIUzI1NiJ9.refresh.payload")
        String refreshToken,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Access token expiration time in seconds.",
            example = "600")
        long accessTokenExpiresIn,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Refresh token expiration time in seconds.",
            example = "1209600")
        long refreshTokenExpiresIn) {
  public TokenPairResponse withRefreshToken(String refreshToken, long refreshTokenExpiresIn) {
    return new TokenPairResponse(
        grantType, accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn);
  }
}
