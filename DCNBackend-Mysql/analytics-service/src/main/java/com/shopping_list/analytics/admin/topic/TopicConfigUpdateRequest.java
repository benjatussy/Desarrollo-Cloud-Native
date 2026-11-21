package com.shopping_list.analytics.admin.topic;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record TopicConfigUpdateRequest(
        @Min(60_000) @Max(7_776_000_000L) Long retentionMs,
        @Pattern(regexp = "delete|compact") String cleanupPolicy) {

    public boolean hasChanges() {
        return retentionMs != null || cleanupPolicy != null;
    }
}
