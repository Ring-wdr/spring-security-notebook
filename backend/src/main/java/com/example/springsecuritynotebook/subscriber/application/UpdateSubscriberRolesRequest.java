package com.example.springsecuritynotebook.subscriber.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UpdateSubscriberRolesRequest(
    @NotEmpty
        @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Complete role set that should be assigned to the subscriber.",
            example = "[\"ROLE_USER\", \"ROLE_MANAGER\"]")
        List<@NotBlank String> roleNames) {}
