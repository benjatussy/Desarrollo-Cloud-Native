package com.shopping_list.analytics.stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class ShoppingActivityParser {

    private static final int SUPPORTED_SCHEMA_VERSION = 1;
    private static final String PURCHASE_EVENT_TYPE = "ITEM_PURCHASED";

    private final ObjectMapper objectMapper;

    public ShoppingActivityParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ParsedShoppingActivity parse(String payload) {
        try {
            JsonNode event = objectMapper.readTree(payload);
            UUID eventId = UUID.fromString(requiredText(event, "eventId"));
            int schemaVersion = requiredInt(event, "schemaVersion");
            String eventType = requiredText(event, "eventType");
            Instant occurredAt = Instant.parse(requiredText(event, "occurredAt"));
            long itemId = requiredLong(event, "itemId");
            long userId = requiredLong(event, "userId");

            if (schemaVersion != SUPPORTED_SCHEMA_VERSION) {
                throw new IllegalArgumentException("Unsupported schemaVersion: " + schemaVersion);
            }
            if (!PURCHASE_EVENT_TYPE.equals(eventType)) {
                throw new IllegalArgumentException("Unsupported eventType: " + eventType);
            }
            if (itemId < 1 || userId < 1) {
                throw new IllegalArgumentException("itemId and userId must be positive");
            }
            return ParsedShoppingActivity.valid(eventId, occurredAt, payload);
        } catch (Exception exception) {
            return ParsedShoppingActivity.invalid(exception.getMessage(), payload);
        }
    }

    private String requiredText(JsonNode event, String field) {
        JsonNode value = event.get(field);
        if (value == null || !value.isTextual() || value.textValue().isBlank()) {
            throw new IllegalArgumentException("Missing or invalid field: " + field);
        }
        return value.textValue();
    }

    private int requiredInt(JsonNode event, String field) {
        JsonNode value = event.get(field);
        if (value == null || !value.canConvertToInt()) {
            throw new IllegalArgumentException("Missing or invalid field: " + field);
        }
        return value.intValue();
    }

    private long requiredLong(JsonNode event, String field) {
        JsonNode value = event.get(field);
        if (value == null || !value.canConvertToLong()) {
            throw new IllegalArgumentException("Missing or invalid field: " + field);
        }
        return value.longValue();
    }

    public record ParsedShoppingActivity(UUID eventId, Instant occurredAt, String error, String rawPayload) {
        public boolean valid() {
            return error == null;
        }

        static ParsedShoppingActivity valid(UUID eventId, Instant occurredAt, String rawPayload) {
            return new ParsedShoppingActivity(eventId, occurredAt, null, rawPayload);
        }

        static ParsedShoppingActivity invalid(String error, String rawPayload) {
            return new ParsedShoppingActivity(null, null, error == null ? "Invalid event" : error, rawPayload);
        }
    }
}
