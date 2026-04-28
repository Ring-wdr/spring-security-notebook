package com.example.springsecuritynotebook.content.api;

import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import com.example.springsecuritynotebook.content.application.ContentDetailResponse;
import com.example.springsecuritynotebook.content.application.ContentService;
import com.example.springsecuritynotebook.content.application.ContentSummaryResponse;
import com.example.springsecuritynotebook.content.application.ContentUpsertRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
public class ContentController {

  private final ContentService contentService;

  public ContentController(ContentService contentService) {
    this.contentService = contentService;
  }

  @GetMapping
  @PreAuthorize("hasAuthority('CONTENT_READ')")
  public List<ContentSummaryResponse> getContents(
      @AuthenticationPrincipal SubscriberPrincipal principal,
      @RequestParam(defaultValue = "false") boolean includeAll) {
    return contentService.getContents(principal, includeAll);
  }

  @GetMapping("/{contentId}")
  @PreAuthorize("hasAuthority('CONTENT_READ')")
  public ContentDetailResponse getContent(
      @AuthenticationPrincipal SubscriberPrincipal principal,
      @PathVariable Long contentId,
      @RequestParam(defaultValue = "false") boolean includeAll) {
    return contentService.getContent(principal, contentId, includeAll);
  }

  @PostMapping
  @PreAuthorize("hasAuthority('CONTENT_WRITE')")
  public ContentDetailResponse createContent(@Valid @RequestBody ContentUpsertRequest request) {
    return contentService.createContent(request);
  }

  @PutMapping("/{contentId}")
  @PreAuthorize("hasAuthority('CONTENT_WRITE')")
  public ContentDetailResponse updateContent(
      @PathVariable Long contentId, @Valid @RequestBody ContentUpsertRequest request) {
    return contentService.updateContent(contentId, request);
  }
}
