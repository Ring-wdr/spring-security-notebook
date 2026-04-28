package com.example.springsecuritynotebook.subscriber.api;

import com.example.springsecuritynotebook.auth.handler.ErrorResponse;
import com.example.springsecuritynotebook.subscriber.application.SubscriberAdminService;
import com.example.springsecuritynotebook.subscriber.application.SubscriberSummaryResponse;
import com.example.springsecuritynotebook.subscriber.application.UpdateSubscriberRolesRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@Tag(
    name = "Admin Subscribers",
    description = "Authority-protected subscriber administration APIs.")
public class AdminSubscriberController {

  private final SubscriberAdminService subscriberAdminService;

  public AdminSubscriberController(SubscriberAdminService subscriberAdminService) {
    this.subscriberAdminService = subscriberAdminService;
  }

  @GetMapping
  @PreAuthorize("hasAuthority('USER_READ')")
  @Operation(
      summary = "List subscribers",
      description = "Returns every subscriber in the system. Requires the USER_READ authority.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Subscriber list returned successfully.",
        content =
            @Content(
                mediaType = "application/json",
                array =
                    @ArraySchema(
                        schema = @Schema(implementation = SubscriberSummaryResponse.class)))),
    @ApiResponse(
        responseCode = "401",
        description = "Authentication is required.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "403",
        description = "Authenticated user does not have the USER_READ authority.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  public List<SubscriberSummaryResponse> getSubscribers() {
    return subscriberAdminService.getSubscribers();
  }

  @PatchMapping("/{email}/role")
  @PreAuthorize("hasAuthority('USER_ROLE_UPDATE')")
  @Operation(
      summary = "Replace subscriber roles",
      description =
          "Replaces the subscriber's entire role set. Requires the USER_ROLE_UPDATE authority.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Roles updated successfully.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = SubscriberSummaryResponse.class))),
    @ApiResponse(
        responseCode = "400",
        description = "Request payload validation failed.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "401",
        description = "Authentication is required.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "403",
        description = "Authenticated user does not have the USER_ROLE_UPDATE authority.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "404",
        description = "Subscriber was not found.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  public SubscriberSummaryResponse updateRoles(
      @PathVariable String email, @Valid @RequestBody UpdateSubscriberRolesRequest request) {
    return subscriberAdminService.updateRoles(email, request);
  }
}
