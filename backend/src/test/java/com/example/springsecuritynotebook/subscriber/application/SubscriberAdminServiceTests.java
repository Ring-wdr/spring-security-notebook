package com.example.springsecuritynotebook.subscriber.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubscriberAdminServiceTests {

  @Mock private SubscriberRepository subscriberRepository;

  @Test
  void updateRolesRejectsBlankRoleNameBeforeMutation() {
    Subscriber subscriber = subscriber();
    SubscriberAdminService service = new SubscriberAdminService(subscriberRepository);

    when(subscriberRepository.findByEmail("user@example.com")).thenReturn(Optional.of(subscriber));

    assertThatThrownBy(
            () ->
                service.updateRoles(
                    "user@example.com",
                    new UpdateSubscriberRolesRequest(List.of("ROLE_USER", " "))))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Subscriber role must not be blank.");

    verify(subscriberRepository).findByEmail("user@example.com");
    assertThat(subscriber.getRoleList()).containsExactly(SubscriberRole.ROLE_MANAGER);
  }

  @Test
  void updateRolesRejectsNullRoleNameBeforeMutation() {
    Subscriber subscriber = subscriber();
    SubscriberAdminService service = new SubscriberAdminService(subscriberRepository);

    when(subscriberRepository.findByEmail("user@example.com")).thenReturn(Optional.of(subscriber));

    assertThatThrownBy(
            () ->
                service.updateRoles(
                    "user@example.com",
                    new UpdateSubscriberRolesRequest(Arrays.asList("ROLE_USER", null))))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Subscriber role must not be blank.");

    verify(subscriberRepository).findByEmail("user@example.com");
    assertThat(subscriber.getRoleList()).containsExactly(SubscriberRole.ROLE_MANAGER);
  }

  private Subscriber subscriber() {
    Subscriber subscriber =
        Subscriber.builder()
            .email("user@example.com")
            .password("password")
            .nickname("user")
            .build();
    subscriber.addRole(SubscriberRole.ROLE_MANAGER);
    return subscriber;
  }
}
