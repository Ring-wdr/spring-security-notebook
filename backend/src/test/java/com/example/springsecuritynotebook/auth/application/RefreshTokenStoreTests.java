package com.example.springsecuritynotebook.auth.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class RefreshTokenStoreTests {

  @Autowired private RefreshTokenStore refreshTokenStore;

  @BeforeEach
  void setUp() {
    refreshTokenStore.invalidate("rotate@example.com");
  }

  @Test
  void rotateIfMatchesSucceedsOnlyOncePerExpectedToken() {
    refreshTokenStore.store("rotate@example.com", "family-1", "original-token", 120L);

    boolean firstRotation =
        refreshTokenStore.rotateIfMatches(
            "rotate@example.com", "family-1", "original-token", "rotated-token", 300L);
    boolean secondRotation =
        refreshTokenStore.rotateIfMatches(
            "rotate@example.com", "family-1", "original-token", "stale-second-token", 300L);

    assertThat(firstRotation).isTrue();
    assertThat(secondRotation).isFalse();
    assertThat(refreshTokenStore.get("rotate@example.com")).contains("rotated-token");
    assertThat(
            refreshTokenStore.findRetrySuccessor(
                "rotate@example.com", "family-1", "original-token"))
        .contains("rotated-token");
  }

  @Test
  void retrySuccessorBecomesInvalidAfterNextRotation() {
    refreshTokenStore.store("rotate@example.com", "family-1", "original-token", 120L);
    refreshTokenStore.rotateIfMatches(
        "rotate@example.com", "family-1", "original-token", "rotated-token", 300L);
    refreshTokenStore.rotateIfMatches(
        "rotate@example.com", "family-1", "rotated-token", "next-rotated-token", 300L);

    assertThat(
            refreshTokenStore.findRetrySuccessor(
                "rotate@example.com", "family-1", "original-token"))
        .isEmpty();
    assertThat(refreshTokenStore.hasTokenState("rotate@example.com", "family-1", "original-token"))
        .isTrue();
  }

  @Test
  void invalidateFamilyRemovesCurrentToken() {
    refreshTokenStore.store("rotate@example.com", "family-1", "original-token", 120L);

    refreshTokenStore.invalidateFamily("rotate@example.com", "family-1");

    assertThat(refreshTokenStore.get("rotate@example.com")).isEmpty();
    assertThat(refreshTokenStore.get("rotate@example.com", "family-1")).isEmpty();
  }
}
