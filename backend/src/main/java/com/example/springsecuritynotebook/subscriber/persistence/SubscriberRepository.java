package com.example.springsecuritynotebook.subscriber.persistence;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriberRepository extends JpaRepository<Subscriber, String> {

  @EntityGraph(attributePaths = "roleList")
  Optional<Subscriber> findByEmail(String email);
}
