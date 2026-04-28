package com.example.springsecuritynotebook.auth.handler;

import io.swagger.v3.oas.annotations.media.Schema;

public record ErrorResponse(
    @Schema(
            description = "Machine-readable error code returned by the security layer.",
            example = "ERROR_ACCESS_DENIED")
        String error,
    @Schema(
            description = "Human-readable message that explains the failure.",
            example = "You do not have permission.")
        String message) {

  public static ErrorResponse of(String error, String message) {
    return new ErrorResponse(error, message);
  }
}
