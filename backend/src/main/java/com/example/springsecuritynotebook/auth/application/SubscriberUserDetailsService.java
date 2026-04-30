package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.subscriber.application.SubscriberUserLookup;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class SubscriberUserDetailsService implements UserDetailsService {

  private final SubscriberUserLookup subscriberUserLookup;

  public SubscriberUserDetailsService(SubscriberUserLookup subscriberUserLookup) {
    this.subscriberUserLookup = subscriberUserLookup;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    Subscriber subscriber =
        subscriberUserLookup
            .findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("Subscriber was not found."));

    return SubscriberPrincipal.from(subscriber);
  }
}
