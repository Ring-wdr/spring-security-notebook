package com.example.springsecuritynotebook.subscriber.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface SubscriberRepository extends JpaRepository<Subscriber, String> {

    @EntityGraph(attributePaths = "roleList")
    Optional<Subscriber> findByEmail(String email);
}
