package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import java.util.Optional;

public interface SubscriberUserLookup {

  Optional<Subscriber> findByEmail(String email);
}
