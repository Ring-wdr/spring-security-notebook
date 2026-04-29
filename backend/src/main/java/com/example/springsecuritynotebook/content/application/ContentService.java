package com.example.springsecuritynotebook.content.application;

import com.example.springsecuritynotebook.content.domain.Content;
import com.example.springsecuritynotebook.content.persistence.ContentRepository;
import com.example.springsecuritynotebook.shared.exception.ResourceNotFoundException;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
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
      Collection<? extends GrantedAuthority> authorities, boolean includeAll) {
    if (includeAll && canViewAll(authorities)) {
      return getAllContents();
    }

    return getPublishedContents();
  }

  @Transactional(readOnly = true)
  public ContentDetailResponse getContent(
      Collection<? extends GrantedAuthority> authorities, Long contentId, boolean includeAll) {
    if (includeAll && canViewAll(authorities)) {
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

  private boolean canViewAll(Collection<? extends GrantedAuthority> authorities) {
    return authorities.stream()
        .map(GrantedAuthority::getAuthority)
        .anyMatch("CONTENT_DRAFT_READ"::equals);
  }
}
