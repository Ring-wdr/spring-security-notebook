package com.example.springsecuritynotebook.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.service-tokens.content")
public record ContentServiceTokenProperties(String published, String management) {}
