package com.example.springsecuritynotebook.auth.application;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

  @Mock private JwtService jwtService;

  @Mock private RefreshTokenStore refreshTokenStore;

  @Mock private AccessTokenBlocklist accessTokenBlocklist;

  @Test
  void logoutStillInvalidatesRefreshTokenWhenAccessTokenLifetimeLookupFails() {
    AuthService authService = new AuthService(jwtService, refreshTokenStore, accessTokenBlocklist);
    SubscriberPrincipal principal =
        new SubscriberPrincipal("user@example.com", "", "user", false, List.of("ROLE_USER"));

    when(jwtService.getRemainingLifetimeSeconds("access-token"))
        .thenThrow(new CustomJwtException("ERROR_ACCESS_TOKEN"));

    authService.logout(principal, "Bearer access-token");

    verify(refreshTokenStore).invalidate("user@example.com");
    verifyNoInteractions(accessTokenBlocklist);
  }

  @Test
  void logoutRevokesAccessTokenWhenLifetimeLookupSucceeds() {
    AuthService authService = new AuthService(jwtService, refreshTokenStore, accessTokenBlocklist);
    SubscriberPrincipal principal =
        new SubscriberPrincipal("user@example.com", "", "user", false, List.of("ROLE_USER"));

    when(jwtService.getRemainingLifetimeSeconds("access-token")).thenReturn(10L);

    authService.logout(principal, "Bearer access-token");

    verify(accessTokenBlocklist).revoke("access-token", 10L);
    verify(refreshTokenStore).invalidate("user@example.com");
  }
}
