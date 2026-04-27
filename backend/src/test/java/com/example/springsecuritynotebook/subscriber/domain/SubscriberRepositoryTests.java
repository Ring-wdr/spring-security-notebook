package com.example.springsecuritynotebook.subscriber.domain;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceUnitUtil;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class SubscriberRepositoryTests {

  @Autowired private SubscriberRepository subscriberRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @Autowired private EntityManagerFactory entityManagerFactory;

  @Autowired private JdbcTemplate jdbcTemplate;

  @BeforeEach
  void cleanUp() {
    jdbcTemplate.execute("TRUNCATE TABLE subscriber_roles, subscribers RESTART IDENTITY CASCADE");
  }

  @Test
  void saveAndFindSubscriberByEmailLoadsRoles() {
    Subscriber subscriber =
        Subscriber.builder()
            .email("user1@example.com")
            .password(passwordEncoder.encode("1111"))
            .nickname("user-one")
            .build();
    subscriber.addRole(SubscriberRole.ROLE_USER);
    subscriber.addRole(SubscriberRole.ROLE_MANAGER);

    subscriberRepository.saveAndFlush(subscriber);

    Optional<Subscriber> result = subscriberRepository.findByEmail("user1@example.com");

    assertThat(result).isPresent();
    Subscriber loadedSubscriber = result.orElseThrow();
    PersistenceUnitUtil persistenceUnitUtil = entityManagerFactory.getPersistenceUnitUtil();

    assertThat(loadedSubscriber.getEmail()).isEqualTo("user1@example.com");
    assertThat(loadedSubscriber.getNickname()).isEqualTo("user-one");
    assertThat(loadedSubscriber.getRoleList())
        .containsExactlyInAnyOrder(SubscriberRole.ROLE_USER, SubscriberRole.ROLE_MANAGER);
    assertThat(persistenceUnitUtil.isLoaded(loadedSubscriber, "roleList")).isTrue();
  }
}
