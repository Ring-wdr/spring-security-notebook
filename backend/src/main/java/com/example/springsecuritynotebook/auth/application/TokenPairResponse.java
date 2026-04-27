package com.example.springsecuritynotebook.auth.application;

public record TokenPairResponse(
        String grantType,
        String accessToken,
        String refreshToken,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn
) {
    public TokenPairResponse withRefreshToken(String refreshToken, long refreshTokenExpiresIn) {
        return new TokenPairResponse(
                grantType,
                accessToken,
                refreshToken,
                accessTokenExpiresIn,
                refreshTokenExpiresIn
        );
    }
}
