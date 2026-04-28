package com.example.springsecuritynotebook.content.application;

import com.example.springsecuritynotebook.auth.application.SubscriberPrincipal;
import com.example.springsecuritynotebook.content.domain.Content;
import com.example.springsecuritynotebook.content.persistence.ContentRepository;
import com.example.springsecuritynotebook.shared.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContentService {

  private final ContentRepository contentRepository;

  public ContentService(ContentRepository contentRepository) {
    this.contentRepository = contentRepository;
  }

  @Transactional(readOnly = true)
  public List<ContentSummaryResponse> getContents(
      SubscriberPrincipal principal, boolean includeAll) {
    if (includeAll && canViewAll(principal)) {
      return getAllContents();
    }

    return getPublishedContents();
  }

  @Transactional(readOnly = true)
  public ContentDetailResponse getContent(
      SubscriberPrincipal principal, Long contentId, boolean includeAll) {
    if (includeAll && canViewAll(principal)) {
      return getAnyContent(contentId);
    }

    return getPublishedContent(contentId);
  }

  private List<ContentSummaryResponse> getPublishedContents() {
    return contentRepository.findByPublishedTrueOrderByIdDesc().stream()
        .map(ContentSummaryResponse::from)
        .toList();
  }

  private List<ContentSummaryResponse> getAllContents() {
    return contentRepository.findAllByOrderByIdDesc().stream()
        .map(ContentSummaryResponse::from)
        .toList();
  }

  private ContentDetailResponse getPublishedContent(Long contentId) {
    Content content =
        contentRepository
            .findByIdAndPublishedTrue(contentId)
            .orElseThrow(() -> new ResourceNotFoundException("ERROR_CONTENT_NOT_FOUND"));
    return ContentDetailResponse.from(content);
  }

  private ContentDetailResponse getAnyContent(Long contentId) {
    Content content =
        contentRepository
            .findById(contentId)
            .orElseThrow(() -> new ResourceNotFoundException("ERROR_CONTENT_NOT_FOUND"));
    return ContentDetailResponse.from(content);
  }

  @Transactional
  public ContentDetailResponse createContent(ContentUpsertRequest request) {
    Content content =
        Content.builder()
            .title(request.title())
            .body(request.body())
            .category(request.category())
            .published(request.published())
            .build();

    return ContentDetailResponse.from(contentRepository.save(content));
  }

  @Transactional
  public ContentDetailResponse updateContent(Long contentId, ContentUpsertRequest request) {
    Content content =
        contentRepository
            .findById(contentId)
            .orElseThrow(() -> new ResourceNotFoundException("ERROR_CONTENT_NOT_FOUND"));

    content.update(request.title(), request.body(), request.category(), request.published());
    return ContentDetailResponse.from(content);
  }

  private boolean canViewAll(SubscriberPrincipal principal) {
    return principal != null
        && principal.getRoleNames().stream()
            .anyMatch(role -> role.equals("ROLE_MANAGER") || role.equals("ROLE_ADMIN"));
  }
}
