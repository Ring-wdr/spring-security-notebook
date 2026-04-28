package com.example.springsecuritynotebook.auth.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

@SpringBootTest
@ActiveProfiles("test")
class SecurityConfigTests {

  @Autowired private WebApplicationContext webApplicationContext;

  @Autowired private PasswordEncoder passwordEncoder;

  @Autowired private CorsConfigurationSource corsConfigurationSource;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    this.mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
  }

  @Test
  void actuatorHealthIsAccessibleWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
  }

  @Test
  void openApiDocsAreAccessibleWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
  }

  @Test
  void openApiDocsSkipJwtFilterEvenWithMalformedAuthorizationHeader() throws Exception {
    mockMvc
        .perform(get("/v3/api-docs").header(HttpHeaders.AUTHORIZATION, "not-a-bearer-token"))
        .andExpect(status().isOk());
  }

  @Test
  void openApiDocsDoNotExposeAuthorizationHeaderAsOperationParameter() throws Exception {
    mockMvc
        .perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(content().string(not(containsString("\"name\":\"Authorization\""))));
  }

  @Test
  void openApiDocsExposeFormLoginEndpoint() throws Exception {
    mockMvc
        .perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("\"/api/auth/login\"")))
        .andExpect(content().string(containsString("\"application/x-www-form-urlencoded\"")))
        .andExpect(content().string(containsString("\"LoginRequest\"")))
        .andExpect(content().string(containsString("\"Login and issue JWT tokens\"")));
  }

  @Test
  void openApiDocsExposeBearerSchemeAndProtectedOperationDescriptions() throws Exception {
    mockMvc
        .perform(get("/v3/api-docs"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("\"bearerAuth\"")))
        .andExpect(content().string(containsString("\"scheme\":\"bearer\"")))
        .andExpect(content().string(containsString("\"Logout current user\"")))
        .andExpect(content().string(containsString("AUTH_LOGOUT")))
        .andExpect(content().string(containsString("CONTENT_DRAFT_READ")))
        .andExpect(content().string(containsString("USER_ROLE_UPDATE")));
  }

  @Test
  void swaggerUiIsAccessibleWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isOk());
  }

  @Test
  void passwordEncoderEncodesAndMatches() {
    String rawPassword = "demo-password";
    String encodedPassword = passwordEncoder.encode(rawPassword);

    assertThat(encodedPassword).isNotEqualTo(rawPassword);
    assertThat(passwordEncoder.matches(rawPassword, encodedPassword)).isTrue();
  }

  @Test
  void corsConfigurationAllowsFrontendOrigin() {
    HttpServletRequest request = new MockHttpServletRequest("GET", "/api/example");

    CorsConfiguration configuration = corsConfigurationSource.getCorsConfiguration(request);

    assertThat(configuration).isNotNull();
    assertThat(configuration.getAllowedOrigins()).contains("http://localhost:3000");
    assertThat(configuration.getAllowedMethods())
        .contains("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
  }
}
