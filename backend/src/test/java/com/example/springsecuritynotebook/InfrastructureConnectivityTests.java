package com.example.springsecuritynotebook;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class InfrastructureConnectivityTests {

  @Autowired private JdbcTemplate jdbcTemplate;

  @Autowired private StringRedisTemplate stringRedisTemplate;

  @Test
  void postgresConnectionIsAvailable() {
    Integer result = jdbcTemplate.queryForObject("select 1", Integer.class);

    assertThat(result).isEqualTo(1);
  }

  @Test
  void valkeyConnectionIsAvailable() {
    String key = "infra:test:" + UUID.randomUUID();

    stringRedisTemplate.opsForValue().set(key, "ok");
    String value = stringRedisTemplate.opsForValue().get(key);
    stringRedisTemplate.delete(key);

    assertThat(value).isEqualTo("ok");
  }
}
