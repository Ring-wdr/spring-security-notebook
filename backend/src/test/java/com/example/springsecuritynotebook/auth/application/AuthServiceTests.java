package com.example.springsecuritynotebook.auth.application;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import com.example.springsecuritynotebook.subscriber.application.SubscriberUserLookup;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

  @Mock private JwtService jwtService;

  @Mock private RefreshTokenStore refreshTokenStore;

  @Mock private AccessTokenBlocklist accessTokenBlocklist;

  @Mock private SubscriberUserLookup subscriberUserLookup;

  @Test
  void logoutStillInvalidatesRefreshTokenWhenAccessTokenLifetimeLookupFails() {
    AuthService authService =
        new AuthService(jwtService, refreshTokenStore, accessTokenBlocklist, subscriberUserLookup);
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
    AuthService authService =
        new AuthService(jwtService, refreshTokenStore, accessTokenBlocklist, subscriberUserLookup);
    SubscriberPrincipal principal =
        new SubscriberPrincipal("user@example.com", "", "user", false, List.of("ROLE_USER"));

    when(jwtService.getRemainingLifetimeSeconds("access-token")).thenReturn(10L);

    authService.logout(principal, "Bearer access-token");

    var inOrder = inOrder(accessTokenBlocklist, refreshTokenStore);
    inOrder.verify(accessTokenBlocklist).revoke("access-token", 10L);
    inOrder.verify(refreshTokenStore).invalidate("user@example.com");
  }

  @Test
  void refreshFailsWhenAtomicRotationRejectsStaleRefreshToken() {
    AuthService authService =
        new AuthService(jwtService, refreshTokenStore, accessTokenBlocklist, subscriberUserLookup);
    AccessTokenClaims accessClaims =
        new AccessTokenClaims("user@example.com", "user", false, List.of("ROLE_USER"));
    Subscriber subscriber =
        Subscriber.builder().email("user@example.com").password("encoded").nickname("user").build();
    subscriber.addRole(SubscriberRole.ROLE_USER);

    when(accessTokenBlocklist.isRevoked("access-token")).thenReturn(false);
    when(jwtService.readAccessClaimsAllowExpired("access-token")).thenReturn(accessClaims);
    when(jwtService.validateRefreshTokenEmail("refresh-token")).thenReturn("user@example.com");
    when(subscriberUserLookup.findByEmail("user@example.com")).thenReturn(Optional.of(subscriber));
    when(jwtService.getAccessTokenExpiresInSeconds()).thenReturn(600L);
    when(jwtService.generateAccessToken(accessClaims, 600L)).thenReturn("new-access-token");
    when(jwtService.getRefreshTokenExpiresInSeconds()).thenReturn(86400L);
    when(jwtService.generateRefreshToken("user@example.com", 86400L)).thenReturn("new-refresh");
    when(refreshTokenStore.rotateIfMatches(
            "user@example.com", "refresh-token", "new-refresh", 86400L))
        .thenReturn(false);

    org.assertj.core.api.Assertions.assertThatThrownBy(
            () ->
                authService.refresh(
                    "Bearer access-token", new RefreshTokenRequest("refresh-token")))
        .isInstanceOf(CustomJwtException.class)
        .hasMessage("ERROR_REFRESH_TOKEN");
  }
}
