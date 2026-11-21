package com.shopping_list.analytics.admin.topic;

import java.util.List;
import java.util.Map;

public record TopicDetails(String name, boolean internal, List<PartitionDetails> partitions, Map<String, String> configs) {
    public record PartitionDetails(int partition, Integer leader, List<Integer> replicas, List<Integer> inSyncReplicas) {
    }
}
