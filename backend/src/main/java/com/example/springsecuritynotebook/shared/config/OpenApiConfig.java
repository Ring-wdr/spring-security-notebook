package com.example.springsecuritynotebook.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@SuppressWarnings("unchecked")
public class OpenApiConfig {

  private static final String BEARER_AUTH = "bearerAuth";
  private static final String LOGIN_REQUEST = "LoginRequest";
  private static final String ERROR_RESPONSE = "ErrorResponse";

  @Bean
  OpenAPI openApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Spring Security Notebook API")
                .version("v1")
                .description(
                    "JWT authentication practice API for Spring Security learning. "
                        + "Use /api/auth/login to obtain tokens, click Authorize with the "
                        + "returned access token, then explore logout and authority-based APIs."))
        .paths(new Paths().addPathItem("/api/auth/login", loginPath()))
        .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
        .components(
            new Components()
                .addSchemas(LOGIN_REQUEST, loginRequestSchema())
                .addSchemas(ERROR_RESPONSE, errorResponseSchema())
                .addSecuritySchemes(
                    BEARER_AUTH,
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
  }

  private PathItem loginPath() {
    return new PathItem()
        .post(
            new Operation()
                .tags(List.of("Authentication"))
                .operationId("login")
                .summary("Login and issue JWT tokens")
                .description(
                    "Authenticates with form-urlencoded email/password credentials and returns "
                        + "an access token plus refresh token for Swagger testing.")
                .security(List.of())
                .requestBody(
                    new RequestBody()
                        .required(true)
                        .description("Login form fields consumed by Spring Security formLogin.")
                        .content(
                            new Content()
                                .addMediaType(
                                    "application/x-www-form-urlencoded",
                                    new io.swagger.v3.oas.models.media.MediaType()
                                        .schema(ref(LOGIN_REQUEST)))))
                .responses(
                    new ApiResponses()
                        .addApiResponse(
                            "200",
                            new ApiResponse()
                                .description("Authentication succeeded and JWT tokens were issued.")
                                .content(
                                    new Content()
                                        .addMediaType(
                                            "application/json",
                                            new io.swagger.v3.oas.models.media.MediaType()
                                                .schema(ref("TokenPairResponse")))))
                        .addApiResponse(
                            "401",
                            new ApiResponse()
                                .description(
                                    "Authentication failed because the credentials were invalid.")
                                .content(
                                    new Content()
                                        .addMediaType(
                                            "application/json",
                                            new io.swagger.v3.oas.models.media.MediaType()
                                                .schema(ref(ERROR_RESPONSE)))))));
  }

  private Schema<Object> loginRequestSchema() {
    return new ObjectSchema()
        .description("Form fields submitted to /api/auth/login.")
        .addProperty(
            "email",
            new StringSchema()
                .minLength(1)
                .description("Email used as the username parameter.")
                .example("user@example.com"))
        .addProperty(
            "password",
            new StringSchema()
                .minLength(1)
                .description("Plain-text password for login testing.")
                .example("1111"))
        .required(List.of("email", "password"));
  }

  private Schema<Object> errorResponseSchema() {
    return new ObjectSchema()
        .description(
            "Standard JSON error payload returned by authentication and authorization handlers.")
        .addProperty("error", new StringSchema().example("ERROR_ACCESS_DENIED"))
        .addProperty("message", new StringSchema().example("You do not have permission."))
        .required(List.of("error", "message"));
  }

  private Schema<Object> ref(String schemaName) {
    return new Schema<>().$ref("#/components/schemas/" + schemaName);
  }
}
