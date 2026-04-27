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
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@ActiveProfiles("test")
class RefreshTokenFlowTests {

    @Autowired
    private SubscriberRepository subscriberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenStore refreshTokenStore;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        subscriberRepository.deleteAll();
        refreshTokenStore.invalidate("user@example.com");

        Subscriber subscriber = Subscriber.builder()
                .email("user@example.com")
                .password(passwordEncoder.encode("1111"))
                .nickname("user")
                .build();
        subscriber.addRole(SubscriberRole.ROLE_USER);
        subscriberRepository.save(subscriber);
    }

    @Test
    void expiredAccessAndValidRefreshReturnsNewAccessToken() throws Exception {
        SubscriberPrincipal principal = new SubscriberPrincipal(
                "user@example.com",
                "",
                "user",
                false,
                java.util.List.of("ROLE_USER")
        );

        String expiredAccessToken = jwtService.generateAccessToken(principal.getClaims(), -30);
        String refreshToken = jwtService.generateRefreshToken("user@example.com", jwtService.getRefreshTokenExpiresInSeconds());
        refreshTokenStore.store("user@example.com", refreshToken, jwtService.getRefreshTokenExpiresInSeconds());

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredAccessToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.grantType").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.refreshToken").isString())
                .andReturn();

        TokenPairResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                TokenPairResponse.class
        );

        assertThat(jwtService.validateToken(response.accessToken()))
                .containsEntry("email", "user@example.com");
    }

    @Test
    void logoutInvalidatesStoredRefreshToken() throws Exception {
        String accessToken = loginAndExtractToken("user@example.com", "1111");

        mockMvc.perform(post("/api/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isNoContent());

        assertThat(refreshTokenStore.get("user@example.com")).isEmpty();
    }

    private String loginAndExtractToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .param("email", email)
                        .param("password", password))
                .andExpect(status().isOk())
                .andReturn();

        TokenPairResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                TokenPairResponse.class
        );
        return response.accessToken();
    }
}
