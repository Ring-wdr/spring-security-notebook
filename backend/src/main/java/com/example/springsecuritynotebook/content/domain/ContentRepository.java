package com.example.springsecuritynotebook.content.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentRepository extends JpaRepository<Content, Long> {
    List<Content> findByPublishedTrueOrderByIdDesc();
    Optional<Content> findByIdAndPublishedTrue(Long id);
}
