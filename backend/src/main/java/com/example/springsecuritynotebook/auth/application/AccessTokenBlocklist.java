package com.example.springsecuritynotebook.auth.application;

import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class AccessTokenBlocklist {

  private static final String REVOKED_VALUE = "revoked";

  private final StringRedisTemplate stringRedisTemplate;

  public AccessTokenBlocklist(StringRedisTemplate stringRedisTemplate) {
    this.stringRedisTemplate = stringRedisTemplate;
  }

  public void revoke(String accessToken, long expiresInSeconds) {
    if (expiresInSeconds <= 0) {
      return;
    }

    stringRedisTemplate
        .opsForValue()
        .set(buildKey(accessToken), REVOKED_VALUE, Duration.ofSeconds(expiresInSeconds));
  }

  public boolean isRevoked(String accessToken) {
    return Boolean.TRUE.equals(stringRedisTemplate.hasKey(buildKey(accessToken)));
  }

  private String buildKey(String accessToken) {
    return "auth:revoked:" + accessToken;
  }
}
