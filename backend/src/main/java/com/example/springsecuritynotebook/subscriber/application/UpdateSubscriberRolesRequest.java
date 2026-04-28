package com.example.springsecuritynotebook.subscriber.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UpdateSubscriberRolesRequest(
    @NotEmpty @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<String> roleNames) {}
