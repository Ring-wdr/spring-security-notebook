package com.example.springsecuritynotebook.shared.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
    @NotBlank String issuer,
    @NotBlank String secret,
    @Min(1) int accessTokenMinutes,
    @Min(1) int refreshTokenMinutes) {}
