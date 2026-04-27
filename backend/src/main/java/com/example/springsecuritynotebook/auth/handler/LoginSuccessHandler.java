package com.example.springsecuritynotebook.auth.handler;

import com.example.springsecuritynotebook.auth.application.AuthService;
import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import com.example.springsecuritynotebook.auth.application.TokenPairResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class LoginSuccessHandler implements AuthenticationSuccessHandler {

  private final AuthService authService;
  private final ObjectMapper objectMapper;

  public LoginSuccessHandler(AuthService authService, ObjectMapper objectMapper) {
    this.authService = authService;
    this.objectMapper = objectMapper;
  }

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request, HttpServletResponse response, Authentication authentication)
      throws IOException, ServletException {
    SubscriberPrincipal principal = (SubscriberPrincipal) authentication.getPrincipal();
    TokenPairResponse tokenPair = authService.issueTokens(principal);

    response.setStatus(HttpServletResponse.SC_OK);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    objectMapper.writeValue(response.getWriter(), tokenPair);
  }
}
