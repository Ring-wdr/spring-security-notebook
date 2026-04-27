package com.example.springsecuritynotebook.auth.exception;

public class CustomJwtException extends RuntimeException {

  public CustomJwtException(String message) {
    super(message);
  }
}
