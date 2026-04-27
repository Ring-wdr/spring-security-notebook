package com.example.springsecuritynotebook.auth.application;

public record TokenPairResponse(
        String grantType,
        String accessToken,
        String refreshToken,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn
) {
}
