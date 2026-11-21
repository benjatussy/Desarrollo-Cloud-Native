package com.shopping_list.analytics.admin.error;

public class KafkaAdminOperationException extends RuntimeException {

    private final Failure failure;

    public KafkaAdminOperationException(Failure failure, String message) {
        super(message);
        this.failure = failure;
    }

    public KafkaAdminOperationException(Failure failure, String message, Throwable cause) {
        super(message, cause);
        this.failure = failure;
    }

    public Failure failure() {
        return failure;
    }

    public enum Failure {
        INVALID_REQUEST,
        NOT_FOUND,
        CONFLICT,
        BROKER_UNAVAILABLE
    }
}
