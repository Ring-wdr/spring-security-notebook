package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.example.springsecuritynotebook.subscriber.application.SubscriberUserLookup;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class SubscriberUserDetailsServiceTests {

  @Mock private SubscriberUserLookup subscriberUserLookup;

  @Test
  void missingSubscriberUsesGenericExceptionMessage() {
    when(subscriberUserLookup.findByEmail("missing@example.com")).thenReturn(Optional.empty());

    SubscriberUserDetailsService service = new SubscriberUserDetailsService(subscriberUserLookup);

    assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
        .isInstanceOf(UsernameNotFoundException.class)
        .hasMessage("Subscriber was not found.");
  }
}
