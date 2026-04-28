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

  @Bean
  OpenAPI openApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Spring Security Notebook API")
                .version("v1")
                .description("JWT authentication practice API for Spring Security learning."))
        .paths(new Paths().addPathItem("/api/auth/login", loginPath()))
        .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
        .components(
            new Components()
                .addSchemas(LOGIN_REQUEST, loginRequestSchema())
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
                .tags(List.of("auth-controller"))
                .operationId("login")
                .security(List.of())
                .requestBody(
                    new RequestBody()
                        .required(true)
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
                                .description("OK")
                                .content(
                                    new Content()
                                        .addMediaType(
                                            "*/*",
                                            new io.swagger.v3.oas.models.media.MediaType()
                                                .schema(ref("TokenPairResponse")))))));
  }

  private Schema<Object> loginRequestSchema() {
    return new ObjectSchema()
        .addProperty("email", new StringSchema().minLength(1))
        .addProperty("password", new StringSchema().minLength(1))
        .required(List.of("email", "password"));
  }

  private Schema<Object> ref(String schemaName) {
    return new Schema<>().$ref("#/components/schemas/" + schemaName);
  }
}
