package com.shopping_list.analytics.admin.error;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class KafkaAdminExceptionHandler {

    @ExceptionHandler(KafkaAdminOperationException.class)
    public ResponseEntity<AdminErrorResponse> handleAdminFailure(KafkaAdminOperationException exception) {
        HttpStatus status = switch (exception.failure()) {
            case INVALID_REQUEST -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case BROKER_UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
        };
        return ResponseEntity.status(status).body(new AdminErrorResponse(exception.failure().name(), exception.getMessage()));
    }

    public record AdminErrorResponse(String code, String message) {
    }
}
