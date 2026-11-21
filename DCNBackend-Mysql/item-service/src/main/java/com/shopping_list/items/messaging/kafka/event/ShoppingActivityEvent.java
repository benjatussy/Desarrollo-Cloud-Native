package com.shopping_list.items.messaging.kafka.event;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record ShoppingActivityEvent(
        UUID eventId,
        int schemaVersion,
        String eventType,
        Instant occurredAt,
        Long itemId,
        Long userId) {

    public ShoppingActivityEvent {
        Objects.requireNonNull(eventId, "eventId is required");
        Objects.requireNonNull(eventType, "eventType is required");
        Objects.requireNonNull(occurredAt, "occurredAt is required");
        Objects.requireNonNull(itemId, "itemId is required");
        Objects.requireNonNull(userId, "userId is required");
        if (schemaVersion < 1) {
            throw new IllegalArgumentException("schemaVersion must be positive");
        }
        if (itemId < 1 || userId < 1) {
            throw new IllegalArgumentException("itemId and userId must be positive");
        }
        if (eventType.isBlank()) {
            throw new IllegalArgumentException("eventType must not be blank");
        }
    }
}
