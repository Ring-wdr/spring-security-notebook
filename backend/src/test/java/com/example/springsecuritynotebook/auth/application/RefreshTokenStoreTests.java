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
    refreshTokenStore.store("rotate@example.com", "original-token", 120L);

    boolean firstRotation =
        refreshTokenStore.rotateIfMatches(
            "rotate@example.com", "original-token", "rotated-token", 300L);
    boolean secondRotation =
        refreshTokenStore.rotateIfMatches(
            "rotate@example.com", "original-token", "stale-second-token", 300L);

    assertThat(firstRotation).isTrue();
    assertThat(secondRotation).isFalse();
    assertThat(refreshTokenStore.get("rotate@example.com")).contains("rotated-token");
  }
}
