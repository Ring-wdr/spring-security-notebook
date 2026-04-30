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

  private static final long RETRY_GRACE_SECONDS = 60L;
  private static final DefaultRedisScript<Long> ROTATE_IF_MATCHES_SCRIPT =
      new DefaultRedisScript<>(
          """
          local current = redis.call('GET', KEYS[1])
          if not current or current ~= ARGV[1] then
            return 0
          end
          redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
          redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[4])
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
            List.of(buildKey(email), buildRetryKey(email, expectedRefreshToken)),
            expectedRefreshToken,
            newRefreshToken,
            String.valueOf(expiresInSeconds),
            String.valueOf(RETRY_GRACE_SECONDS));
    return Long.valueOf(1L).equals(result);
  }

  public Optional<String> findRetrySuccessor(String email, String expectedRefreshToken) {
    String retrySuccessor =
        stringRedisTemplate.opsForValue().get(buildRetryKey(email, expectedRefreshToken));
    if (retrySuccessor == null) {
      return Optional.empty();
    }

    return get(email).filter(retrySuccessor::equals);
  }

  public void invalidate(String email) {
    stringRedisTemplate.delete(buildKey(email));
  }

  private String buildKey(String email) {
    return "auth:refresh:" + email;
  }

  private String buildRetryKey(String email, String refreshToken) {
    return "auth:refresh:retry:" + email + ":" + refreshToken;
  }
}
