package com.example.springsecuritynotebook.content.persistence;

import com.example.springsecuritynotebook.content.domain.Content;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentRepository extends JpaRepository<Content, Long> {
  List<Content> findByPublishedTrueOrderByIdDesc();

  List<Content> findAllByOrderByIdDesc();

  Optional<Content> findByIdAndPublishedTrue(Long id);
}
