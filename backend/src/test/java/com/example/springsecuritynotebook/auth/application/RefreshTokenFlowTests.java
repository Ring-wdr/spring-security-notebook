package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RefreshTokenFlowTests {

  @Autowired private SubscriberRepository subscriberRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @Autowired private JwtService jwtService;

  @Autowired private RefreshTokenStore refreshTokenStore;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private WebApplicationContext webApplicationContext;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

    refreshTokenStore.invalidate("user@example.com");

    Subscriber subscriber =
        Subscriber.builder()
            .email("user@example.com")
            .password(passwordEncoder.encode("1111"))
            .nickname("user")
            .build();
    subscriber.addRole(SubscriberRole.ROLE_USER);
    subscriberRepository.saveAndFlush(subscriber);
  }

  @Test
  void expiredAccessAndValidRefreshReturnsNewAccessToken() throws Exception {
    SubscriberPrincipal principal =
        new SubscriberPrincipal(
            "user@example.com", "", "user", false, java.util.List.of("ROLE_USER"));

    String expiredAccessToken =
        jwtService.generateAccessToken(principal.toAccessTokenClaims(), -30);
    String refreshToken =
        jwtService.generateRefreshToken(
            "user@example.com", jwtService.getRefreshTokenExpiresInSeconds());
    refreshTokenStore.store(
        "user@example.com", refreshToken, jwtService.getRefreshTokenExpiresInSeconds());

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/refresh")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredAccessToken)
                    .contentType("application/json")
                    .content(
                        objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.grantType").value("Bearer"))
            .andExpect(jsonPath("$.accessToken").isString())
            .andExpect(jsonPath("$.refreshToken").isString())
            .andExpect(jsonPath("$.accessTokenExpiresIn").value(600))
            .andExpect(jsonPath("$.refreshTokenExpiresIn").isNumber())
            .andReturn();

    TokenPairResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), TokenPairResponse.class);

    assertThat(jwtService.validateAccessToken(response.accessToken()).email())
        .isEqualTo("user@example.com");
  }

  @Test
  void refreshUsesLatestSubscriberRoles() throws Exception {
    SubscriberPrincipal originalPrincipal =
        new SubscriberPrincipal(
            "user@example.com", "", "user", false, java.util.List.of("ROLE_USER"));

    String expiredAccessToken =
        jwtService.generateAccessToken(originalPrincipal.toAccessTokenClaims(), -30);
    String refreshToken =
        jwtService.generateRefreshToken(
            "user@example.com", jwtService.getRefreshTokenExpiresInSeconds());
    refreshTokenStore.store(
        "user@example.com", refreshToken, jwtService.getRefreshTokenExpiresInSeconds());

    Subscriber subscriber = subscriberRepository.findByEmail("user@example.com").orElseThrow();
    subscriber.clearRoles();
    subscriber.addRole(SubscriberRole.ROLE_MANAGER);
    subscriberRepository.saveAndFlush(subscriber);

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/refresh")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredAccessToken)
                    .contentType("application/json")
                    .content(
                        objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
            .andExpect(status().isOk())
            .andReturn();

    TokenPairResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), TokenPairResponse.class);

    assertThat(jwtService.validateAccessToken(response.accessToken()).roleNames())
        .containsExactly("ROLE_MANAGER");
  }

  @Test
  void logoutInvalidatesStoredRefreshToken() throws Exception {
    String accessToken = loginAndExtractToken("user@example.com", "1111");

    mockMvc
        .perform(
            post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
        .andExpect(status().isNoContent());

    assertThat(refreshTokenStore.get("user@example.com")).isEmpty();
  }

  @Test
  void refreshAfterLogoutReturnsAccessTokenErrorMessage() throws Exception {
    MvcResult loginResult =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .param("email", "user@example.com")
                    .param("password", "1111"))
            .andExpect(status().isOk())
            .andReturn();

    TokenPairResponse loginResponse =
        objectMapper.readValue(
            loginResult.getResponse().getContentAsString(), TokenPairResponse.class);

    mockMvc
        .perform(
            post("/api/auth/logout")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginResponse.accessToken()))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(
            post("/api/auth/refresh")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginResponse.accessToken())
                .contentType("application/json")
                .content(
                    objectMapper.writeValueAsString(
                        new RefreshTokenRequest(loginResponse.refreshToken()))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_TOKEN"))
        .andExpect(jsonPath("$.message").value("Access token is invalid or expired."));
  }

  @Test
  void logoutRevokesCurrentAccessTokenForProtectedApis() throws Exception {
    String accessToken = loginAndExtractToken("user@example.com", "1111");

    mockMvc
        .perform(
            post("/api/auth/logout").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_TOKEN"))
        .andExpect(jsonPath("$.message").value("Access token is invalid or expired."));
  }

  @Test
  void refreshNearExpiryRotatesRefreshTokenAndUpdatesStore() throws Exception {
    SubscriberPrincipal principal =
        new SubscriberPrincipal(
            "user@example.com", "", "user", false, java.util.List.of("ROLE_USER"));

    String expiredAccessToken =
        jwtService.generateAccessToken(principal.toAccessTokenClaims(), -30);
    String refreshToken = jwtService.generateRefreshToken("user@example.com", 3500);
    refreshTokenStore.store("user@example.com", refreshToken, 3500);

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/refresh")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredAccessToken)
                    .contentType("application/json")
                    .content(
                        objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.refreshToken").isString())
            .andReturn();

    TokenPairResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), TokenPairResponse.class);

    assertThat(response.refreshToken()).isNotEqualTo(refreshToken);
    assertThat(response.refreshTokenExpiresIn())
        .isEqualTo(jwtService.getRefreshTokenExpiresInSeconds());
    assertThat(refreshTokenStore.get("user@example.com")).contains(response.refreshToken());
  }

  @Test
  void refreshWithoutAuthorizationHeaderReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/refresh")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new RefreshTokenRequest("token"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }

  @Test
  void refreshWithMalformedJsonReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/refresh")
                .header(HttpHeaders.AUTHORIZATION, "Bearer malformed-access")
                .contentType("application/json")
                .content("{"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }

  private String loginAndExtractToken(String email, String password) throws Exception {
    MvcResult result =
        mockMvc
            .perform(post("/api/auth/login").param("email", email).param("password", password))
            .andExpect(status().isOk())
            .andReturn();

    TokenPairResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), TokenPairResponse.class);
    return response.accessToken();
  }
}
