package com.example.springsecuritynotebook.auth.api;

import com.example.springsecuritynotebook.auth.application.AuthService;
import com.example.springsecuritynotebook.auth.application.RefreshTokenRequest;
import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import com.example.springsecuritynotebook.auth.application.TokenPairResponse;
import io.swagger.v3.oas.annotations.Parameter;
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
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/refresh")
  public TokenPairResponse refresh(
      @Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION)
          String authorizationHeader,
      @Valid @RequestBody RefreshTokenRequest request) {
    return authService.refresh(authorizationHeader, request);
  }

  @PostMapping("/logout")
  @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
  public ResponseEntity<Void> logout(
      @AuthenticationPrincipal SubscriberPrincipal principal,
      @Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION)
          String authorizationHeader) {
    authService.logout(principal, authorizationHeader);
    return ResponseEntity.noContent().build();
  }
}
