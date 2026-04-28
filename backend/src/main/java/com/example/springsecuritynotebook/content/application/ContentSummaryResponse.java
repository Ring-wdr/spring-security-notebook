package com.example.springsecuritynotebook.content.application;

import com.example.springsecuritynotebook.content.domain.Content;
import io.swagger.v3.oas.annotations.media.Schema;

public record ContentSummaryResponse(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String category,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean published) {
  public static ContentSummaryResponse from(Content content) {
    return new ContentSummaryResponse(
        content.getId(), content.getTitle(), content.getCategory(), content.isPublished());
  }
}
