package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRepository;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
class LoginFlowTests {

  @Autowired private SubscriberRepository subscriberRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @Autowired private JwtService jwtService;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private WebApplicationContext webApplicationContext;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc =
        MockMvcBuilders.webAppContextSetup(webApplicationContext).apply(springSecurity()).build();

    Subscriber subscriber =
        Subscriber.builder()
            .email("manager@example.com")
            .password(passwordEncoder.encode("1111"))
            .nickname("manager")
            .build();
    subscriber.addRole(SubscriberRole.ROLE_MANAGER);
    subscriberRepository.saveAndFlush(subscriber);
  }

  @Test
  void loginSuccessReturnsAccessAndRefreshTokens() throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .param("email", "manager@example.com")
                    .param("password", "1111"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.grantType").value("Bearer"))
            .andExpect(jsonPath("$.accessToken").isString())
            .andExpect(jsonPath("$.refreshToken").isString())
            .andExpect(jsonPath("$.accessTokenExpiresIn").value(600))
            .andExpect(jsonPath("$.refreshTokenExpiresIn").value(86400))
            .andReturn();

    TokenPairResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), TokenPairResponse.class);

    assertThat(jwtService.validateToken(response.accessToken()))
        .containsEntry("email", "manager@example.com")
        .containsEntry("nickname", "manager");
    assertThat(jwtService.validateToken(response.refreshToken()))
        .containsEntry("email", "manager@example.com");
  }

  @Test
  void loginFailureReturnsUnauthorizedJson() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/login")
                .param("email", "manager@example.com")
                .param("password", "wrong-password"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("ERROR_LOGIN"))
        .andExpect(jsonPath("$.message").value("Login failed."));
  }
}
