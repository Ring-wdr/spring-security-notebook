package com.example.springsecuritynotebook.auth.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
    @NotBlank
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Refresh token paired with the current access token.",
            example = "eyJhbGciOiJIUzI1NiJ9.refresh.payload")
        String refreshToken) {}
