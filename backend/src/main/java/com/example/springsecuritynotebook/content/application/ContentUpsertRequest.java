package com.example.springsecuritynotebook.content.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record ContentUpsertRequest(
    @NotBlank @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
    @NotBlank @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String body,
    @NotBlank @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String category,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean published) {}
