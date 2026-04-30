package com.example.springsecuritynotebook.content.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ContentUpsertRequest(
    @NotBlank
        @Size(max = 150)
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Content title.",
            example = "JWT filter chain walkthrough")
        String title,
    @NotBlank
        @Size(max = 10000)
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Main article body.",
            example = "Explains how a request passes through the Spring Security filter chain.")
        String body,
    @NotBlank
        @Size(max = 80)
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
