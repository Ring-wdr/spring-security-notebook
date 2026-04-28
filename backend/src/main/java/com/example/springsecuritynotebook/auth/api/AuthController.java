package com.example.springsecuritynotebook.auth.api;

import com.example.springsecuritynotebook.auth.application.AuthService;
import com.example.springsecuritynotebook.auth.application.RefreshTokenRequest;
import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import com.example.springsecuritynotebook.auth.application.TokenPairResponse;
import com.example.springsecuritynotebook.auth.handler.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Login-adjacent token endpoints and logout flow.")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/refresh")
  @Operation(
      summary = "Refresh access token",
      description =
          "Requires the current Authorization Bearer access token and a refresh token in the "
              + "request body. Returns a rotated token pair when the refresh flow succeeds.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Tokens were refreshed successfully.",
        content = @Content(schema = @Schema(implementation = TokenPairResponse.class))),
    @ApiResponse(
        responseCode = "401",
        description = "Access token or refresh token was invalid or expired.",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public TokenPairResponse refresh(
      @Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION)
          String authorizationHeader,
      @Valid @RequestBody RefreshTokenRequest request) {
    return authService.refresh(authorizationHeader, request);
  }

  @PostMapping("/logout")
  @PreAuthorize("hasAuthority('AUTH_LOGOUT')")
  @Operation(
      summary = "Logout current user",
      description =
          "Revokes the current access token and invalidates the stored refresh token. "
              + "Requires the AUTH_LOGOUT authority.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "204",
        description = "Logout completed and tokens were invalidated."),
    @ApiResponse(
        responseCode = "401",
        description = "Authentication token was missing, malformed, or expired.",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "403",
        description = "Authenticated user does not have the AUTH_LOGOUT authority.",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  })
  public ResponseEntity<Void> logout(
      @AuthenticationPrincipal SubscriberPrincipal principal,
      @Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION)
          String authorizationHeader) {
    authService.logout(principal, authorizationHeader);
    return ResponseEntity.noContent().build();
  }
}
