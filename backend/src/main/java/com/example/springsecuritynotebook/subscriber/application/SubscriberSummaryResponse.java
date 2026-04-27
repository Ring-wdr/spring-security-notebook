package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import java.util.List;

public record SubscriberSummaryResponse(
    String email, String nickname, boolean social, List<String> roleNames) {
  public static SubscriberSummaryResponse from(Subscriber subscriber) {
    return new SubscriberSummaryResponse(
        subscriber.getEmail(),
        subscriber.getNickname(),
        subscriber.isSocial(),
        subscriber.getRoleList().stream().map(SubscriberRole::name).toList());
  }
}
