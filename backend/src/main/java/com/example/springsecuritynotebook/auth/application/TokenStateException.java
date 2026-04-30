package com.example.springsecuritynotebook.auth.application;

public class TokenStateException extends RuntimeException {

  public TokenStateException(String message, Throwable cause) {
    super(message, cause);
  }
}
