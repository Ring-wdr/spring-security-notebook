package com.example.springsecuritynotebook.content.application;

import com.example.springsecuritynotebook.content.domain.Content;
import io.swagger.v3.oas.annotations.media.Schema;

public record ContentDetailResponse(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String body,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String category,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean published) {
  public static ContentDetailResponse from(Content content) {
    return new ContentDetailResponse(
        content.getId(),
        content.getTitle(),
        content.getBody(),
        content.getCategory(),
        content.isPublished());
  }
}
