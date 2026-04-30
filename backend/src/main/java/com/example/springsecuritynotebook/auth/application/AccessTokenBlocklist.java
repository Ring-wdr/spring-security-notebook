package com.example.springsecuritynotebook.auth.application;

import java.time.Duration;
import org.springframework.dao.DataAccessException;
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

    try {
      stringRedisTemplate
          .opsForValue()
          .set(buildKey(accessToken), REVOKED_VALUE, Duration.ofSeconds(expiresInSeconds));
    } catch (DataAccessException exception) {
      throw new TokenStateException("Access token state is unavailable.", exception);
    }
  }

  public boolean isRevoked(String accessToken) {
    try {
      return Boolean.TRUE.equals(stringRedisTemplate.hasKey(buildKey(accessToken)));
    } catch (DataAccessException exception) {
      throw new TokenStateException("Access token state is unavailable.", exception);
    }
  }

  private String buildKey(String accessToken) {
    return "auth:revoked:" + accessToken;
  }
}
