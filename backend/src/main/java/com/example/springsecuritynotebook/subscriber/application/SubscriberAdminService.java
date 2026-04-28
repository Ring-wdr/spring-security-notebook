package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.auth.exception.ResourceNotFoundException;
import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import com.example.springsecuritynotebook.subscriber.persistence.SubscriberRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriberAdminService {

  private final SubscriberRepository subscriberRepository;

  public SubscriberAdminService(SubscriberRepository subscriberRepository) {
    this.subscriberRepository = subscriberRepository;
  }

  @Transactional(readOnly = true)
  public List<SubscriberSummaryResponse> getSubscribers() {
    return subscriberRepository.findAll().stream().map(SubscriberSummaryResponse::from).toList();
  }

  @Transactional
  public SubscriberSummaryResponse updateRoles(String email, UpdateSubscriberRolesRequest request) {
    Subscriber subscriber =
        subscriberRepository
            .findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("ERROR_SUBSCRIBER_NOT_FOUND"));

    subscriber.clearRoles();
    request.roleNames().stream().map(SubscriberRole::valueOf).forEach(subscriber::addRole);

    return SubscriberSummaryResponse.from(subscriber);
  }
}
