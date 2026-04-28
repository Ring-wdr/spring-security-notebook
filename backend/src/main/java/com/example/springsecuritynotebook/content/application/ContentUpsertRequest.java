package com.example.springsecuritynotebook.content.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContentUpsertRequest(
    @NotBlank
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Content title.",
            example = "JWT filter chain walkthrough")
        String title,
    @NotBlank
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Main article body.",
            example = "Explains how a request passes through the Spring Security filter chain.")
        String body,
    @NotBlank
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Category label used by the learning app.",
            example = "security")
        String category,
    @NotNull @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Whether the content is visible to regular users.",
            example = "true")
        Boolean published) {}
