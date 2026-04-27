package com.example.springsecuritynotebook.auth.handler;

public record ErrorResponse(String error, String message) {

  public static ErrorResponse of(String error, String message) {
    return new ErrorResponse(error, message);
  }
}
