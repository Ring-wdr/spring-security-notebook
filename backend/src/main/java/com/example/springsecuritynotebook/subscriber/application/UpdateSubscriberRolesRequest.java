package com.example.springsecuritynotebook.subscriber.application;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UpdateSubscriberRolesRequest(@NotEmpty List<String> roleNames) {}
