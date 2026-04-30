package com.example.springsecuritynotebook.shared.config;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class JwtPropertiesValidationTests {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void secretMustBeAtLeast32Characters() {
    var violations = validator.validate(new JwtProperties("issuer", "too-short-secret", 10, 1440));

    assertThat(violations)
        .anySatisfy(
            violation -> {
              assertThat(violation.getPropertyPath().toString()).isEqualTo("secret");
            });
  }
}
