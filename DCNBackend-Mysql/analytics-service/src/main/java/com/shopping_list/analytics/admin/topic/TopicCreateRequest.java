package com.shopping_list.analytics.admin.topic;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record TopicCreateRequest(
        @NotBlank @Pattern(regexp = "shopping-(activity|analytics)-[a-z0-9][a-z0-9.-]{0,180}") String name,
        @Min(1) @Max(24) int partitions,
        @Min(2) @Max(3) short replicationFactor,
        @Positive @Min(60_000) @Max(7_776_000_000L) long retentionMs,
        @NotBlank @Pattern(regexp = "delete|compact") String cleanupPolicy) {
}
