package com.example.springsecuritynotebook.auth.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class SubscriberUserDetailsService implements UserDetailsService {

  private final SubscriberRepository subscriberRepository;

  public SubscriberUserDetailsService(SubscriberRepository subscriberRepository) {
    this.subscriberRepository = subscriberRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    Subscriber subscriber =
        subscriberRepository
            .findByEmail(username)
            .orElseThrow(() -> new UsernameNotFoundException("Subscriber not found: " + username));

    return SubscriberPrincipal.from(subscriber);
  }
}
