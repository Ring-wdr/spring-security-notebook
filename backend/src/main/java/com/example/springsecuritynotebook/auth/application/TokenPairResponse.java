package com.example.springsecuritynotebook.auth.application;

import io.swagger.v3.oas.annotations.media.Schema;

public record TokenPairResponse(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String grantType,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String accessToken,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String refreshToken,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long accessTokenExpiresIn,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) long refreshTokenExpiresIn) {
  public TokenPairResponse withRefreshToken(String refreshToken, long refreshTokenExpiresIn) {
    return new TokenPairResponse(
        grantType, accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn);
  }
}
