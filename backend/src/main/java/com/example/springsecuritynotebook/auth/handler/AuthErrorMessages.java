package com.example.springsecuritynotebook.auth.handler;

public final class AuthErrorMessages {

  private AuthErrorMessages() {}

  public static String getMessage(String errorCode) {
    return switch (errorCode) {
      case "ERROR_UNAUTHORIZED" -> "Authentication is required.";
      case "ERROR_ACCESS_DENIED" -> "You do not have permission.";
      case "ERROR_ACCESS_TOKEN" -> "Access token is invalid or expired.";
      case "ERROR_REFRESH_TOKEN" -> "Refresh token is invalid or expired.";
      case "ERROR_LOGIN" -> "Login failed.";
      case "ERROR_BAD_REQUEST" -> "Request payload is invalid.";
      case "ERROR_CONTENT_NOT_FOUND" -> "Content was not found.";
      case "ERROR_SUBSCRIBER_NOT_FOUND" -> "Subscriber was not found.";
      default -> errorCode;
    };
  }
}
