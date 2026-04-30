package com.example.springsecuritynotebook.auth.application;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenStore {

  private static final DefaultRedisScript<Long> ROTATE_IF_MATCHES_SCRIPT =
      new DefaultRedisScript<>(
          """
          local current = redis.call('GET', KEYS[1])
          if not current or current ~= ARGV[1] then
            return 0
          end
          redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
          return 1
          """,
          Long.class);

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

  public boolean rotateIfMatches(
      String email, String expectedRefreshToken, String newRefreshToken, long expiresInSeconds) {
    Long result =
        stringRedisTemplate.execute(
            ROTATE_IF_MATCHES_SCRIPT,
            List.of(buildKey(email)),
            expectedRefreshToken,
            newRefreshToken,
            String.valueOf(expiresInSeconds));
    return Long.valueOf(1L).equals(result);
  }

  public void invalidate(String email) {
    stringRedisTemplate.delete(buildKey(email));
  }

  private String buildKey(String email) {
    return "auth:refresh:" + email;
  }
}
