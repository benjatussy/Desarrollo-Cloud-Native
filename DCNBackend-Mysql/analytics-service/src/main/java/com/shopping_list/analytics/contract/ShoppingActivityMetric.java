package com.shopping_list.analytics.contract;

import java.time.Instant;
import java.util.Objects;

public record ShoppingActivityMetric(Instant windowStart, int shard, long purchaseCount) {

    public ShoppingActivityMetric {
        Objects.requireNonNull(windowStart, "windowStart is required");
        if (shard < 0 || purchaseCount < 1) {
            throw new IllegalArgumentException("shard must be non-negative and purchaseCount must be positive");
        }
    }
}
