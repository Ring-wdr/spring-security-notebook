package com.example.springsecuritynotebook.content.application;

import com.example.springsecuritynotebook.content.domain.Content;
import io.swagger.v3.oas.annotations.media.Schema;

public record ContentDetailResponse(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED, example = "1") Long id,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Content title.",
            example = "Protected Content")
        String title,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Complete content body.",
            example = "only for logged-in users")
        String body,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Category label.",
            example = "security")
        String category,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Whether the content is published.",
            example = "true")
        boolean published) {
  public static ContentDetailResponse from(Content content) {
    return new ContentDetailResponse(
        content.getId(),
        content.getTitle(),
        content.getBody(),
        content.getCategory(),
        content.isPublished());
  }
}
