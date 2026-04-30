package com.example.springsecuritynotebook.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.docs")
public record DocsProperties(boolean publicEnabled) {}
