package com.example.springsecuritynotebook.content.application;

import com.example.springsecuritynotebook.content.domain.Content;

public record ContentDetailResponse(
    Long id, String title, String body, String category, boolean published) {
  public static ContentDetailResponse from(Content content) {
    return new ContentDetailResponse(
        content.getId(),
        content.getTitle(),
        content.getBody(),
        content.getCategory(),
        content.isPublished());
  }
}
