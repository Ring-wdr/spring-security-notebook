package com.example.springsecuritynotebook.shared.bootstrap;

import com.example.springsecuritynotebook.content.domain.Content;
import com.example.springsecuritynotebook.content.domain.ContentRepository;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRepository;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.bootstrap", name = "demo-data-enabled", havingValue = "true")
public class DemoDataInitializer implements ApplicationRunner {

  private final SubscriberRepository subscriberRepository;
  private final ContentRepository contentRepository;
  private final PasswordEncoder passwordEncoder;

  public DemoDataInitializer(
      SubscriberRepository subscriberRepository,
      ContentRepository contentRepository,
      PasswordEncoder passwordEncoder) {
    this.subscriberRepository = subscriberRepository;
    this.contentRepository = contentRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (subscriberRepository.count() == 0) {
      Subscriber user =
          Subscriber.builder()
              .email("user@example.com")
              .password(passwordEncoder.encode("1111"))
              .nickname("user")
              .build();
      user.addRole(SubscriberRole.ROLE_USER);

      Subscriber manager =
          Subscriber.builder()
              .email("manager@example.com")
              .password(passwordEncoder.encode("1111"))
              .nickname("manager")
              .build();
      manager.addRole(SubscriberRole.ROLE_MANAGER);

      Subscriber admin =
          Subscriber.builder()
              .email("admin@example.com")
              .password(passwordEncoder.encode("1111"))
              .nickname("admin")
              .build();
      admin.addRole(SubscriberRole.ROLE_ADMIN);

      subscriberRepository.save(user);
      subscriberRepository.save(manager);
      subscriberRepository.save(admin);
    }

    if (contentRepository.count() == 0) {
      contentRepository.save(
          Content.builder()
              .title("Spring Security Filter Chain")
              .body("Filter chain, authentication, authorization overview.")
              .category("security")
              .published(true)
              .build());
      contentRepository.save(
          Content.builder()
              .title("JWT Practice Notes")
              .body("Token issuance, validation, and refresh strategy outline.")
              .category("jwt")
              .published(true)
              .build());
    }
  }
}
