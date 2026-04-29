package com.example.springsecuritynotebook.content.api;

import com.example.springsecuritynotebook.auth.handler.ErrorResponse;
import com.example.springsecuritynotebook.content.application.ContentDetailResponse;
import com.example.springsecuritynotebook.content.application.ContentService;
import com.example.springsecuritynotebook.content.application.ContentSummaryResponse;
import com.example.springsecuritynotebook.content.application.ContentUpsertRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/content")
@Tag(
    name = "Content",
    description = "Protected content APIs with draft-read and write permissions.")
public class ContentController {

  private final ContentService contentService;

  public ContentController(ContentService contentService) {
    this.contentService = contentService;
  }

  @GetMapping
  @PreAuthorize("hasAuthority('CONTENT_READ')")
  @Operation(
      summary = "List content",
      description =
          "Returns published content for regular readers. When includeAll=true, only users "
              + "with CONTENT_DRAFT_READ can also see draft content.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Content list returned successfully.",
        content =
            @Content(
                mediaType = "application/json",
                array =
                    @ArraySchema(schema = @Schema(implementation = ContentSummaryResponse.class)))),
    @ApiResponse(
        responseCode = "401",
        description = "Authentication is required.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "403",
        description = "Authenticated user does not have the CONTENT_READ authority.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  public List<ContentSummaryResponse> getContents(
      Authentication authentication,
      @Parameter(
              description =
                  "Requests draft content as well. Effective only for users with CONTENT_DRAFT_READ.",
              example = "false")
          @RequestParam(defaultValue = "false")
          boolean includeAll) {
    return contentService.getContents(authentication.getAuthorities(), includeAll);
  }

  @GetMapping("/{contentId}")
  @PreAuthorize("hasAuthority('CONTENT_READ')")
  @Operation(
      summary = "Get content detail",
      description =
          "Returns a single content item. includeAll=true can reveal draft content only when "
              + "the caller also has CONTENT_DRAFT_READ.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Content detail returned successfully.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ContentDetailResponse.class))),
    @ApiResponse(
        responseCode = "401",
        description = "Authentication is required.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "403",
        description = "Authenticated user does not have the CONTENT_READ authority.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "404",
        description = "Requested content was not found or is not visible to the caller.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  public ContentDetailResponse getContent(
      Authentication authentication,
      @PathVariable Long contentId,
      @Parameter(
              description =
                  "Requests draft content as well. Effective only for users with CONTENT_DRAFT_READ.",
              example = "false")
          @RequestParam(defaultValue = "false")
          boolean includeAll) {
    return contentService.getContent(authentication.getAuthorities(), contentId, includeAll);
  }

  @PostMapping
  @PreAuthorize("hasAuthority('CONTENT_WRITE')")
  @Operation(
      summary = "Create content",
      description = "Creates a new content record. Requires the CONTENT_WRITE authority.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Content created successfully.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ContentDetailResponse.class))),
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
        description = "Authenticated user does not have the CONTENT_WRITE authority.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  public ContentDetailResponse createContent(@Valid @RequestBody ContentUpsertRequest request) {
    return contentService.createContent(request);
  }

  @PutMapping("/{contentId}")
  @PreAuthorize("hasAuthority('CONTENT_WRITE')")
  @Operation(
      summary = "Update content",
      description = "Updates an existing content record. Requires the CONTENT_WRITE authority.")
  @ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "Content updated successfully.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ContentDetailResponse.class))),
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
        description = "Authenticated user does not have the CONTENT_WRITE authority.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class))),
    @ApiResponse(
        responseCode = "404",
        description = "Requested content was not found.",
        content =
            @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)))
  })
  public ContentDetailResponse updateContent(
      @PathVariable Long contentId, @Valid @RequestBody ContentUpsertRequest request) {
    return contentService.updateContent(contentId, request);
  }
}
