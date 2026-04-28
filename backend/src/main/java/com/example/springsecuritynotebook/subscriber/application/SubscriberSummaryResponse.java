package com.example.springsecuritynotebook.subscriber.application;

import com.example.springsecuritynotebook.subscriber.domain.Subscriber;
import com.example.springsecuritynotebook.subscriber.domain.SubscriberRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

public record SubscriberSummaryResponse(
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Subscriber email used as the unique identifier.",
            example = "manager@example.com")
        String email,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Subscriber nickname.",
            example = "manager")
        String nickname,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Whether the subscriber was created through social login.",
            example = "false")
        boolean social,
    @Schema(
            requiredMode = Schema.RequiredMode.REQUIRED,
            description = "Granted roles currently assigned to the subscriber.",
            example = "[\"ROLE_USER\", \"ROLE_MANAGER\"]")
        List<String> roleNames) {
  public static SubscriberSummaryResponse from(Subscriber subscriber) {
    return new SubscriberSummaryResponse(
        subscriber.getEmail(),
        subscriber.getNickname(),
        subscriber.isSocial(),
        subscriber.getRoleList().stream().map(SubscriberRole::name).toList());
  }
}
