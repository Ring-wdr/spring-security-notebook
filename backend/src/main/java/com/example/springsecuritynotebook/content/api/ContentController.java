package com.example.springsecuritynotebook.content.api;

import com.example.springsecuritynotebook.content.application.ContentDetailResponse;
import com.example.springsecuritynotebook.content.application.ContentService;
import com.example.springsecuritynotebook.content.application.ContentSummaryResponse;
import com.example.springsecuritynotebook.content.application.ContentUpsertRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/content")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public List<ContentSummaryResponse> getContents() {
        return contentService.getPublishedContents();
    }

    @GetMapping("/{contentId}")
    @PreAuthorize("hasAnyRole('USER', 'MANAGER', 'ADMIN')")
    public ContentDetailResponse getContent(@PathVariable Long contentId) {
        return contentService.getPublishedContent(contentId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ContentDetailResponse createContent(@Valid @RequestBody ContentUpsertRequest request) {
        return contentService.createContent(request);
    }

    @PutMapping("/{contentId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ContentDetailResponse updateContent(
            @PathVariable Long contentId,
            @Valid @RequestBody ContentUpsertRequest request
    ) {
        return contentService.updateContent(contentId, request);
    }
}
