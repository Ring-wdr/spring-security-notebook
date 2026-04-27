package com.example.springsecuritynotebook.content.application;

import com.example.springsecuritynotebook.content.domain.Content;

public record ContentSummaryResponse(
        Long id,
        String title,
        String category,
        boolean published
) {
    public static ContentSummaryResponse from(Content content) {
        return new ContentSummaryResponse(
                content.getId(),
                content.getTitle(),
                content.getCategory(),
                content.isPublished()
        );
    }
}
