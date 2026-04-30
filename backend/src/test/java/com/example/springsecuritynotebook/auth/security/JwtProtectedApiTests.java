package com.example.springsecuritynotebook.auth.security;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.springsecuritynotebook.auth.application.AccessTokenBlocklist;
import com.example.springsecuritynotebook.auth.application.TokenPairResponse;
import com.example.springsecuritynotebook.auth.application.TokenStateException;
import com.example.springsecuritynotebook.content.domain.Content;
import com.example.springsecuritynotebook.content.persistence.ContentRepository;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JwtProtectedApiTests {

  @Autowired private WebApplicationContext webApplicationContext;

  @Autowired private SubscriberRepository subscriberRepository;

  @Autowired private ContentRepository contentRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @Autowired private ObjectMapper objectMapper;

  @MockitoBean private AccessTokenBlocklist accessTokenBlocklist;

  private MockMvc mockMvc;
  private String userToken;
  private String adminToken;
  private String managerToken;
  private final String publishedServiceToken = "test-published-content-service-token";
  private final String managementServiceToken = "test-management-content-service-token";

  @BeforeEach
  void setUp() throws Exception {
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();
    when(accessTokenBlocklist.isRevoked(anyString())).thenReturn(false);

    Subscriber user =
        Subscriber.builder()
            .email("user@example.com")
            .password(passwordEncoder.encode("1111"))
            .nickname("user")
            .build();
    user.addRole(SubscriberRole.ROLE_USER);

    Subscriber admin =
        Subscriber.builder()
            .email("admin@example.com")
            .password(passwordEncoder.encode("1111"))
            .nickname("admin")
            .build();
    admin.addRole(SubscriberRole.ROLE_ADMIN);

    Subscriber manager =
        Subscriber.builder()
            .email("manager@example.com")
            .password(passwordEncoder.encode("1111"))
            .nickname("manager")
            .build();
    manager.addRole(SubscriberRole.ROLE_MANAGER);

    subscriberRepository.saveAndFlush(user);
    subscriberRepository.saveAndFlush(admin);
    subscriberRepository.saveAndFlush(manager);

    contentRepository.saveAndFlush(
        Content.builder()
            .title("Protected Content")
            .body("only for logged-in users")
            .category("security")
            .published(true)
            .build());

    this.userToken = loginAndExtractToken("user@example.com", "1111");
    this.adminToken = loginAndExtractToken("admin@example.com", "1111");
    this.managerToken = loginAndExtractToken("manager@example.com", "1111");
  }

  @Test
  void protectedEndpointWithoutTokenReturns401() throws Exception {
    mockMvc
        .perform(get("/api/users/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_UNAUTHORIZED"))
        .andExpect(jsonPath("$.message").value("Authentication is required."));
  }

  @Test
  void userRoleCannotAccessAdminEndpoint() throws Exception {
    mockMvc
        .perform(get("/api/admin/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_DENIED"))
        .andExpect(jsonPath("$.message").value("You do not have permission."));
  }

  @Test
  void validTokenCanAccessProtectedEndpoint() throws Exception {
    mockMvc
        .perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("user@example.com"))
        .andExpect(jsonPath("$.nickname").value("user"))
        .andExpect(jsonPath("$.social").value(false))
        .andExpect(jsonPath("$.roleNames[0]").value("ROLE_USER"));
  }

  @Test
  void malformedBearerTokenReturnsAccessTokenErrorJson() throws Exception {
    mockMvc
        .perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_TOKEN"))
        .andExpect(jsonPath("$.message").value("Access token is invalid or expired."));
  }

  @Test
  void malformedAuthorizationSchemeReturnsAccessTokenErrorJson() throws Exception {
    mockMvc
        .perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Token abc"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_TOKEN"))
        .andExpect(jsonPath("$.message").value("Access token is invalid or expired."));
  }

  @Test
  void tokenStateFailureReturnsAccessTokenErrorJson() throws Exception {
    when(accessTokenBlocklist.isRevoked(userToken))
        .thenThrow(new TokenStateException("unavailable", new RuntimeException("redis")));

    mockMvc
        .perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_TOKEN"))
        .andExpect(jsonPath("$.message").value("Access token is invalid or expired."));
  }

  @Test
  void managerCanRequestAllContentsIncludingDrafts() throws Exception {
    contentRepository.saveAndFlush(
        Content.builder()
            .title("Draft Content")
            .body("draft")
            .category("draft")
            .published(false)
            .build());

    mockMvc
        .perform(
            get("/api/content")
                .queryParam("includeAll", "true")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken))
        .andExpect(status().isOk())
        .andExpect(
            jsonPath("$[?(@.title == 'Draft Content' && @.published == false)]").isNotEmpty());
  }

  @Test
  void publishedServiceTokenCanReadOnlyPublishedContent() throws Exception {
    contentRepository.saveAndFlush(
        Content.builder()
            .title("Service Hidden Draft")
            .body("draft")
            .category("draft")
            .published(false)
            .build());

    mockMvc
        .perform(
            get("/api/content")
                .queryParam("includeAll", "true")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + publishedServiceToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.title == 'Protected Content')]").isNotEmpty())
        .andExpect(jsonPath("$[?(@.published == false)]").isEmpty());
  }

  @Test
  void publishedServiceTokenCannotReadDraftContentDetail() throws Exception {
    Content draft =
        contentRepository.saveAndFlush(
            Content.builder()
                .title("Service Hidden Draft Detail")
                .body("draft")
                .category("draft")
                .published(false)
                .build());

    mockMvc
        .perform(
            get("/api/content/{contentId}", draft.getId())
                .queryParam("includeAll", "true")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + publishedServiceToken))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("ERROR_CONTENT_NOT_FOUND"));
  }

  @Test
  void managementServiceTokenCanReadDraftContent() throws Exception {
    contentRepository.saveAndFlush(
        Content.builder()
            .title("Service Visible Draft")
            .body("draft")
            .category("draft")
            .published(false)
            .build());

    mockMvc
        .perform(
            get("/api/content")
                .queryParam("includeAll", "true")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managementServiceToken))
        .andExpect(status().isOk())
        .andExpect(
            jsonPath("$[?(@.title == 'Service Visible Draft' && @.published == false)]")
                .isNotEmpty());
  }

  @Test
  void managementServiceTokenCanReadDraftContentDetail() throws Exception {
    Content draft =
        contentRepository.saveAndFlush(
            Content.builder()
                .title("Service Visible Draft Detail")
                .body("draft")
                .category("draft")
                .published(false)
                .build());

    mockMvc
        .perform(
            get("/api/content/{contentId}", draft.getId())
                .queryParam("includeAll", "true")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managementServiceToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Service Visible Draft Detail"))
        .andExpect(jsonPath("$.published").value(false));
  }

  @Test
  void managementServiceTokenDoesNotAuthenticateForContentWrites() throws Exception {
    mockMvc
        .perform(
            post("/api/content")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managementServiceToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Service Write",
                      "body": "service tokens are read-only",
                      "category": "security",
                      "published": true
                    }
                    """))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_TOKEN"))
        .andExpect(jsonPath("$.message").value("Access token is invalid or expired."));
  }

  @Test
  void serviceTokenDoesNotAuthenticateOutsideContentReadEndpoints() throws Exception {
    mockMvc
        .perform(
            get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managementServiceToken))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_TOKEN"));
  }

  @Test
  void userCannotCreateContent() throws Exception {
    mockMvc
        .perform(
            post("/api/content")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "User Draft",
                      "body": "users cannot create content",
                      "category": "security",
                      "published": true
                    }
                    """))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("ERROR_ACCESS_DENIED"))
        .andExpect(jsonPath("$.message").value("You do not have permission."));
  }

  @Test
  void managerCanCreateContent() throws Exception {
    mockMvc
        .perform(
            post("/api/content")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Manager Content",
                      "body": "managers can create content",
                      "category": "security",
                      "published": true
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.title").value("Manager Content"))
        .andExpect(jsonPath("$.body").value("managers can create content"))
        .andExpect(jsonPath("$.category").value("security"))
        .andExpect(jsonPath("$.published").value(true));
  }

  @Test
  void managerCannotCreateContentWhenPayloadExceedsLengthBounds() throws Exception {
    mockMvc
        .perform(
            post("/api/content")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "%s",
                      "body": "%s",
                      "category": "%s",
                      "published": true
                    }
                    """
                        .formatted("t".repeat(151), "b".repeat(10001), "c".repeat(81))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }

  @Test
  void userIncludeAllDoesNotReturnDrafts() throws Exception {
    contentRepository.saveAndFlush(
        Content.builder()
            .title("User Hidden Draft")
            .body("draft")
            .category("draft")
            .published(false)
            .build());

    mockMvc
        .perform(
            get("/api/content")
                .queryParam("includeAll", "true")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.published == false)]").isEmpty());
  }

  @Test
  void missingContentReturnsReadableNotFoundMessage() throws Exception {
    mockMvc
        .perform(
            get("/api/content/999999").header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("ERROR_CONTENT_NOT_FOUND"))
        .andExpect(jsonPath("$.message").value("Content was not found."));
  }

  @Test
  void adminCanUpdateSubscriberRoles() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/users/user@example.com/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleNames\":[\"ROLE_USER\",\"ROLE_MANAGER\"]}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("user@example.com"))
        .andExpect(jsonPath("$.roleNames[0]").value("ROLE_USER"))
        .andExpect(jsonPath("$.roleNames[1]").value("ROLE_MANAGER"));
  }

  @Test
  void emptyRoleListReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/users/user@example.com/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleNames\":[]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }

  @Test
  void unknownRoleNameReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/users/user@example.com/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleNames\":[\"ROLE_USER\",\"ROLE_UNKNOWN\"]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }

  @Test
  void blankRoleNameReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/users/user@example.com/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleNames\":[\"ROLE_USER\",\"\"]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }

  @Test
  void nullRoleNameReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            patch("/api/admin/users/user@example.com/role")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"roleNames\":[\"ROLE_USER\",null]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("ERROR_BAD_REQUEST"))
        .andExpect(jsonPath("$.message").value("Request payload is invalid."));
  }

  @Test
  void missingPublishedFieldReturnsBadRequestJson() throws Exception {
    mockMvc
        .perform(
            post("/api/content")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "title": "Missing published",
                      "body": "payload omits published",
                      "category": "security"
                    }
                    """))
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
