package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriberUserLookupService implements SubscriberUserLookup {

  private final SubscriberRepository subscriberRepository;

  public SubscriberUserLookupService(SubscriberRepository subscriberRepository) {
    this.subscriberRepository = subscriberRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Subscriber> findByEmail(String email) {
    return subscriberRepository.findByEmail(email);
  }
}
