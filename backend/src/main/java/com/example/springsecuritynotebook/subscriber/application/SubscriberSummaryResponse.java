package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record SubscriberSummaryResponse(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String email,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String nickname,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean social,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<String> roleNames) {
  public static SubscriberSummaryResponse from(Subscriber subscriber) {
    return new SubscriberSummaryResponse(
        subscriber.getEmail(),
        subscriber.getNickname(),
        subscriber.isSocial(),
        subscriber.getRoleList().stream().map(SubscriberRole::name).toList());
  }
}
