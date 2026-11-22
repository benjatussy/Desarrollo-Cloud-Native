package com.shopping_list.analytics.admin.group;

import java.util.List;

public record ConsumerGroupDetails(String groupId, String state, int members, List<Member> memberDetails,
                                   List<PartitionOffset> offsets) {
    public record Member(String memberId, String clientId, String host, int assignedPartitions) {
    }

    public record PartitionOffset(String topic, int partition, long committedOffset, long endOffset, long lag) {
    }
}
