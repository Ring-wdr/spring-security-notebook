package com.example.springsecuritynotebook.auth.application;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.springframework.dao.DataAccessException;
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
          redis.call('SET', KEYS[3], 'used', 'EX', ARGV[3])
          redis.call('SET', KEYS[4], ARGV[5], 'EX', ARGV[3])
          redis.call('SADD', KEYS[5], ARGV[5])
          redis.call('EXPIRE', KEYS[5], ARGV[3])
          return 1
          """,
          Long.class);

  private final StringRedisTemplate stringRedisTemplate;

  public RefreshTokenStore(StringRedisTemplate stringRedisTemplate) {
    this.stringRedisTemplate = stringRedisTemplate;
  }

  public void store(String email, String refreshToken, long expiresInSeconds) {
    store(email, "legacy", refreshToken, expiresInSeconds);
  }

  public void store(String email, String familyId, String refreshToken, long expiresInSeconds) {
    runTokenStateOperation(
        () -> {
          deleteTrackedFamilies(email);
          stringRedisTemplate
              .opsForValue()
              .set(buildKey(email, familyId), refreshToken, Duration.ofSeconds(expiresInSeconds));
          stringRedisTemplate
              .opsForValue()
              .set(buildFamilyKey(email), familyId, Duration.ofSeconds(expiresInSeconds));
          stringRedisTemplate.opsForSet().add(buildFamiliesKey(email), familyId);
          stringRedisTemplate.expire(buildFamiliesKey(email), Duration.ofSeconds(expiresInSeconds));
        });
  }

  public Optional<String> get(String email) {
    return runTokenStateOperation(
        () ->
            Optional.ofNullable(stringRedisTemplate.opsForValue().get(buildFamilyKey(email)))
                .flatMap(familyId -> get(email, familyId)));
  }

  public Optional<String> get(String email, String familyId) {
    return runTokenStateOperation(
        () ->
            Optional.ofNullable(stringRedisTemplate.opsForValue().get(buildKey(email, familyId))));
  }

  public long getRemainingTtl(String email) {
    return runTokenStateOperation(
        () -> {
          String familyId = stringRedisTemplate.opsForValue().get(buildFamilyKey(email));
          return familyId == null ? -1L : getRemainingTtl(email, familyId);
        });
  }

  public long getRemainingTtl(String email, String familyId) {
    return runTokenStateOperation(
        () -> {
          Long ttl = stringRedisTemplate.getExpire(buildKey(email, familyId), TimeUnit.SECONDS);
          return ttl == null ? -1L : ttl;
        });
  }

  public boolean rotateIfMatches(
      String email, String expectedRefreshToken, String newRefreshToken, long expiresInSeconds) {
    return rotateIfMatches(
        email, "legacy", expectedRefreshToken, newRefreshToken, expiresInSeconds);
  }

  public boolean rotateIfMatches(
      String email,
      String familyId,
      String expectedRefreshToken,
      String newRefreshToken,
      long expiresInSeconds) {
    return runTokenStateOperation(
        () -> {
          Long result =
              stringRedisTemplate.execute(
                  ROTATE_IF_MATCHES_SCRIPT,
                  List.of(
                      buildKey(email, familyId),
                      buildRetryKey(email, familyId, expectedRefreshToken),
                      buildUsedKey(email, familyId, expectedRefreshToken),
                      buildFamilyKey(email),
                      buildFamiliesKey(email)),
                  expectedRefreshToken,
                  newRefreshToken,
                  String.valueOf(expiresInSeconds),
                  String.valueOf(RETRY_GRACE_SECONDS),
                  familyId);
          return Long.valueOf(1L).equals(result);
        });
  }

  public Optional<String> findRetrySuccessor(String email, String expectedRefreshToken) {
    return findRetrySuccessor(email, "legacy", expectedRefreshToken);
  }

  public Optional<String> findRetrySuccessor(
      String email, String familyId, String expectedRefreshToken) {
    return runTokenStateOperation(
        () -> {
          String retrySuccessor =
              stringRedisTemplate
                  .opsForValue()
                  .get(buildRetryKey(email, familyId, expectedRefreshToken));
          if (retrySuccessor == null) {
            return Optional.empty();
          }

          return get(email, familyId).filter(retrySuccessor::equals);
        });
  }

  public boolean hasTokenState(String email, String familyId, String refreshToken) {
    return runTokenStateOperation(
        () ->
            get(email, familyId).filter(refreshToken::equals).isPresent()
                || Boolean.TRUE.equals(
                    stringRedisTemplate.hasKey(buildRetryKey(email, familyId, refreshToken)))
                || Boolean.TRUE.equals(
                    stringRedisTemplate.hasKey(buildUsedKey(email, familyId, refreshToken))));
  }

  public void invalidate(String email) {
    runTokenStateOperation(() -> deleteTrackedFamilies(email));
  }

  public void invalidateFamily(String email, String familyId) {
    runTokenStateOperation(
        () -> {
          stringRedisTemplate.delete(buildKey(email, familyId));
          stringRedisTemplate.opsForSet().remove(buildFamiliesKey(email), familyId);
          String currentFamilyId = stringRedisTemplate.opsForValue().get(buildFamilyKey(email));
          if (familyId.equals(currentFamilyId)) {
            stringRedisTemplate.delete(buildFamilyKey(email));
          }
        });
  }

  private String buildKey(String email) {
    return "auth:refresh:" + email;
  }

  private String buildKey(String email, String familyId) {
    return "auth:refresh:" + email + ":" + familyId;
  }

  private String buildFamilyKey(String email) {
    return "auth:refresh-family:" + email;
  }

  private String buildFamiliesKey(String email) {
    return "auth:refresh-families:" + email;
  }

  private String buildRetryKey(String email, String familyId, String refreshToken) {
    return "auth:refresh:retry:" + email + ":" + familyId + ":" + refreshToken;
  }

  private String buildUsedKey(String email, String familyId, String refreshToken) {
    return "auth:refresh:used:" + email + ":" + familyId + ":" + refreshToken;
  }

  private void deleteTrackedFamilies(String email) {
    Set<String> familyIds = stringRedisTemplate.opsForSet().members(buildFamiliesKey(email));
    if (familyIds != null) {
      familyIds.forEach(familyId -> stringRedisTemplate.delete(buildKey(email, familyId)));
    }

    String currentFamilyId = stringRedisTemplate.opsForValue().get(buildFamilyKey(email));
    if (currentFamilyId != null) {
      stringRedisTemplate.delete(buildKey(email, currentFamilyId));
    }

    stringRedisTemplate.delete(buildFamiliesKey(email));
    stringRedisTemplate.delete(buildFamilyKey(email));
    stringRedisTemplate.delete(buildKey(email));
  }

  private void runTokenStateOperation(Runnable operation) {
    try {
      operation.run();
    } catch (DataAccessException exception) {
      throw new TokenStateException("Refresh token state is unavailable.", exception);
    }
  }

  private <T> T runTokenStateOperation(TokenStateOperation<T> operation) {
    try {
      return operation.run();
    } catch (DataAccessException exception) {
      throw new TokenStateException("Refresh token state is unavailable.", exception);
    }
  }

  @FunctionalInterface
  private interface TokenStateOperation<T> {
    T run();
  }
}
