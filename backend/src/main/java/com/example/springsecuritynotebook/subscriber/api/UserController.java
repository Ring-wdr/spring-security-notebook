package com.example.springsecuritynotebook.subscriber.api;

import com.example.springsecuritynotebook.auth.application.CurrentUserResponse;
import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import com.example.springsecuritynotebook.auth.handler.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Authenticated user lookup endpoints.")
public class UserController {

  @GetMapping("/me")
  @PreAuthorize("hasAuthority('ME_READ')")
  @Operation(
      summary = "Get current user profile",
      description =
          "Returns the authenticated user profile and granted roles. Requires the ME_READ authority.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Current user profile returned successfully.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = CurrentUserResponse.class))),
    @ApiResponse(
        responseCode = "401",
        description = "Authentication is required.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "403",
        description = "Authenticated user does not have the ME_READ authority.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  public CurrentUserResponse getCurrentUser(
      @AuthenticationPrincipal SubscriberPrincipal principal) {
    return CurrentUserResponse.from(principal);
  }
}
