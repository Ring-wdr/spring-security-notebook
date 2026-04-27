package com.example.springsecuritynotebook.auth.security;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.springsecuritynotebook.content.domain.Content;
import com.example.springsecuritynotebook.content.domain.ContentRepository;
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
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.util.Map;

@SpringBootTest
@ActiveProfiles("test")
class JwtProtectedApiTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private SubscriberRepository subscriberRepository;

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private String userToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        contentRepository.deleteAll();
        subscriberRepository.deleteAll();

        Subscriber user = Subscriber.builder()
                .email("user@example.com")
                .password(passwordEncoder.encode("1111"))
                .nickname("user")
                .build();
        user.addRole(SubscriberRole.ROLE_USER);

        Subscriber admin = Subscriber.builder()
                .email("admin@example.com")
                .password(passwordEncoder.encode("1111"))
                .nickname("admin")
                .build();
        admin.addRole(SubscriberRole.ROLE_ADMIN);

        subscriberRepository.save(user);
        subscriberRepository.save(admin);

        contentRepository.save(Content.builder()
                .title("Protected Content")
                .body("only for logged-in users")
                .category("security")
                .published(true)
                .build());

        this.userToken = loginAndExtractToken("user@example.com", "1111");
    }

    @Test
    void protectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("ERROR_UNAUTHORIZED"));
    }

    @Test
    void userRoleCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ERROR_ACCESS_DENIED"));
    }

    @Test
    void validTokenCanAccessProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.roleNames[0]").value("ROLE_USER"));
    }

    private String loginAndExtractToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .param("email", email)
                        .param("password", password))
                .andExpect(status().isOk())
                .andReturn();

        Map<String, Object> response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                new TypeReference<>() {
                }
        );
        return (String) response.get("accessToken");
    }
}
