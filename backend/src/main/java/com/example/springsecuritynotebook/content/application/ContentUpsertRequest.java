package com.example.springsecuritynotebook.content.application;

import jakarta.validation.constraints.NotBlank;

public record ContentUpsertRequest(
    @NotBlank String title, @NotBlank String body, @NotBlank String category, boolean published) {}
