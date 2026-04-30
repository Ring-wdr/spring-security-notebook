package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.springsecuritynotebook.auth.config.ContentServiceTokenProperties;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

class ContentServiceTokenAuthenticationServiceTests {

  private static final String PUBLISHED_TOKEN = "published-service-token-32-characters";
  private static final String MANAGEMENT_TOKEN = "management-service-token-32-characters";

  @Test
  void publishedTokenAuthenticatesAsReadOnlyMachinePrincipal() {
    ContentServiceTokenAuthenticationService service =
        new ContentServiceTokenAuthenticationService(
            new ContentServiceTokenProperties(PUBLISHED_TOKEN, MANAGEMENT_TOKEN));

    var authentication = service.authenticate(PUBLISHED_TOKEN);

    assertThat(authentication).isPresent();
    assertThat(authentication.orElseThrow().getName()).isEqualTo("content-published-service");
    assertThat(authentication.orElseThrow().getAuthorities())
        .extracting(GrantedAuthority::getAuthority)
        .containsExactly("CONTENT_READ")
        .doesNotContain(
            "CONTENT_DRAFT_READ",
            "CONTENT_WRITE",
            "USER_READ",
            "USER_ROLE_UPDATE",
            "ROLE_USER",
            "ROLE_MANAGER",
            "ROLE_ADMIN");
  }

  @Test
  void managementTokenAuthenticatesAsDraftReadMachinePrincipalWithoutWriteOrUserAuthorities() {
    ContentServiceTokenAuthenticationService service =
        new ContentServiceTokenAuthenticationService(
            new ContentServiceTokenProperties(PUBLISHED_TOKEN, MANAGEMENT_TOKEN));

    var authentication = service.authenticate(MANAGEMENT_TOKEN);

    assertThat(authentication).isPresent();
    assertThat(authentication.orElseThrow().getName()).isEqualTo("content-management-service");
    assertThat(authentication.orElseThrow().getAuthorities())
        .extracting(GrantedAuthority::getAuthority)
        .containsExactlyInAnyOrder("CONTENT_READ", "CONTENT_DRAFT_READ")
        .doesNotContain(
            "CONTENT_WRITE",
            "USER_READ",
            "USER_ROLE_UPDATE",
            "ROLE_USER",
            "ROLE_MANAGER",
            "ROLE_ADMIN");
  }

  @Test
  void unknownBlankOrMissingTokensDoNotAuthenticate() {
    ContentServiceTokenAuthenticationService service =
        new ContentServiceTokenAuthenticationService(
            new ContentServiceTokenProperties(PUBLISHED_TOKEN, MANAGEMENT_TOKEN));

    assertThat(service.authenticate("unknown-service-token-32-characters")).isEmpty();
    assertThat(service.authenticate("")).isEmpty();
    assertThat(service.authenticate("   ")).isEmpty();

    ContentServiceTokenAuthenticationService unconfiguredService =
        new ContentServiceTokenAuthenticationService(new ContentServiceTokenProperties("", ""));

    assertThat(unconfiguredService.authenticate(PUBLISHED_TOKEN)).isEmpty();
  }

  @Test
  void configuredTokensMustMeetMinimumLength() {
    assertThatThrownBy(
            () ->
                new ContentServiceTokenAuthenticationService(
                    new ContentServiceTokenProperties("too-short", MANAGEMENT_TOKEN)))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("app.service-tokens.content.published")
        .hasMessageContaining("at least 32 characters");

    assertThatThrownBy(
            () ->
                new ContentServiceTokenAuthenticationService(
                    new ContentServiceTokenProperties(PUBLISHED_TOKEN, "too-short")))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("app.service-tokens.content.management")
        .hasMessageContaining("at least 32 characters");
  }
}
