package com.example.springsecuritynotebook.auth.handler;

import com.example.springsecuritynotebook.auth.exception.CustomJwtException;
import com.example.springsecuritynotebook.auth.exception.ResourceNotFoundException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(CustomJwtException.class)
  public ResponseEntity<Map<String, String>> handleCustomJwtException(
      CustomJwtException exception) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(
            Map.of(
                "error", exception.getMessage(),
                "message", AuthErrorMessages.getMessage(exception.getMessage())));
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(
            Map.of(
                "error",
                exception.getMessage(),
                "message",
                AuthErrorMessages.getMessage(exception.getMessage())));
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    MethodArgumentNotValidException.class,
    MissingRequestHeaderException.class,
    HttpMessageNotReadableException.class
  })
  public ResponseEntity<Map<String, String>> handleBadRequest(Exception exception) {
    return ResponseEntity.badRequest()
        .body(
            Map.of(
                "error",
                "ERROR_BAD_REQUEST",
                "message",
                AuthErrorMessages.getMessage("ERROR_BAD_REQUEST")));
  }
}
