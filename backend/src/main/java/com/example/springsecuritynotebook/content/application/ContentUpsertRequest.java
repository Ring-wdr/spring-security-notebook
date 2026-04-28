package com.example.springsecuritynotebook.content.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContentUpsertRequest(
    @NotBlank @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
    @NotBlank @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String body,
    @NotBlank @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String category,
    @NotNull @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Boolean published) {}
