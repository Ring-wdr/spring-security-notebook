package com.example.springsecuritynotebook.auth.security;

import com.example.springsecuritynotebook.auth.application.AccessTokenBlocklist;
import com.example.springsecuritynotebook.auth.application.AccessTokenClaims;
import com.example.springsecuritynotebook.auth.application.JwtService;
import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import com.example.springsecuritynotebook.auth.handler.AuthErrorMessages;
import com.example.springsecuritynotebook.auth.handler.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtService jwtService;
  private final AccessTokenBlocklist accessTokenBlocklist;
  private final ObjectMapper objectMapper;

  public JwtAuthenticationFilter(
      JwtService jwtService, AccessTokenBlocklist accessTokenBlocklist, ObjectMapper objectMapper) {
    this.jwtService = jwtService;
    this.accessTokenBlocklist = accessTokenBlocklist;
    this.objectMapper = objectMapper;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
      return true;
    }

    String requestUri = request.getRequestURI();
    return List.of("/api/auth/login", "/api/auth/refresh", "/actuator/health", "/actuator/info")
        .contains(requestUri);
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

    if (authorizationHeader == null) {
      filterChain.doFilter(request, response);
      return;
    }

    if (!authorizationHeader.startsWith("Bearer ")) {
      writeAccessTokenError(response);
      return;
    }

    String token = authorizationHeader.substring(7);
    if (accessTokenBlocklist.isRevoked(token)) {
      writeAccessTokenError(response);
      return;
    }

    AccessTokenClaims claims;
    try {
      claims = jwtService.validateAccessToken(token);
    } catch (CustomJwtException exception) {
      writeAccessTokenError(response);
      return;
    }

    SubscriberPrincipal principal = claims.toPrincipal();

    UsernamePasswordAuthenticationToken authenticationToken =
        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
    filterChain.doFilter(request, response);
  }

  private void writeAccessTokenError(HttpServletResponse response) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    objectMapper.writeValue(
        response.getWriter(),
        ErrorResponse.of("ERROR_ACCESS_TOKEN", AuthErrorMessages.getMessage("ERROR_ACCESS_TOKEN")));
  }
}
