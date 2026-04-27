package com.example.springsecuritynotebook.auth.application;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenStore {

  private static final long REFRESH_REISSUE_THRESHOLD_SECONDS = 3600L;
  private final StringRedisTemplate stringRedisTemplate;

  public RefreshTokenStore(StringRedisTemplate stringRedisTemplate) {
    this.stringRedisTemplate = stringRedisTemplate;
  }

  public void store(String email, String refreshToken, long expiresInSeconds) {
    stringRedisTemplate
        .opsForValue()
        .set(buildKey(email), refreshToken, Duration.ofSeconds(expiresInSeconds));
  }

  public Optional<String> get(String email) {
    return Optional.ofNullable(stringRedisTemplate.opsForValue().get(buildKey(email)));
  }

  public long getRemainingTtl(String email) {
    Long ttl = stringRedisTemplate.getExpire(buildKey(email), TimeUnit.SECONDS);
    return ttl == null ? -1L : ttl;
  }

  public boolean shouldReissue(String email) {
    long ttl = getRemainingTtl(email);
    return ttl >= 0 && ttl < REFRESH_REISSUE_THRESHOLD_SECONDS;
  }

  public void invalidate(String email) {
    stringRedisTemplate.delete(buildKey(email));
  }

  private String buildKey(String email) {
    return "auth:refresh:" + email;
  }
}
