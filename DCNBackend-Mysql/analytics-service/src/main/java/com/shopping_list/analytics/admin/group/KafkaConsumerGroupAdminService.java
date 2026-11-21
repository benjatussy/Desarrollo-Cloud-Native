package com.shopping_list.analytics.admin.group;

import com.shopping_list.analytics.admin.error.KafkaAdminOperationException;
import com.shopping_list.analytics.admin.error.KafkaAdminOperationException.Failure;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ConsumerGroupDescription;
import org.apache.kafka.clients.admin.ConsumerGroupListing;
import org.apache.kafka.clients.admin.OffsetSpec;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.errors.GroupIdNotFoundException;
import org.apache.kafka.common.errors.GroupNotEmptyException;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.clients.admin.ListOffsetsResult.ListOffsetsResultInfo;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;

@Service
public class KafkaConsumerGroupAdminService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(KafkaConsumerGroupAdminService.class);
    private static final long REQUEST_TIMEOUT_SECONDS = 10;
    private static final Pattern MANAGED_GROUP_ID = Pattern.compile("shopping-[a-z0-9][a-z0-9.-]{0,180}");
    private static final String STREAMS_APPLICATION_ID = "shopping-activity-streams-v1";
    private static final Set<String> DELETABLE_STATES = Set.of("EMPTY", "DEAD");

    private final AdminClient adminClient;

    public KafkaConsumerGroupAdminService(AdminClient adminClient) {
        this.adminClient = adminClient;
    }

    public List<ConsumerGroupSummary> listGroups() {
        Collection<ConsumerGroupListing> listings = await(adminClient.listConsumerGroups().all(), "list consumer groups");
        List<String> groupIds = listings.stream()
                .map(ConsumerGroupListing::groupId)
                .filter(KafkaConsumerGroupAdminService::isManagedGroup)
                .sorted()
                .toList();
        if (groupIds.isEmpty()) {
            return List.of();
        }
        Map<String, ConsumerGroupDescription> descriptions = await(
                adminClient.describeConsumerGroups(groupIds).all(), "describe consumer groups");
        return groupIds.stream()
                .map(groupId -> toSummary(groupId, descriptions.get(groupId)))
                .toList();
    }

    public ConsumerGroupDetails describeGroup(String groupId) {
        requireManagedGroup(groupId);
        ConsumerGroupDescription description = describe(groupId);
        Map<TopicPartition, OffsetAndMetadata> committed = await(
                adminClient.listConsumerGroupOffsets(groupId).partitionsToOffsetAndMetadata(), "read committed offsets");

        Map<TopicPartition, OffsetSpec> latestRequests = new HashMap<>();
        committed.keySet().forEach(partition -> latestRequests.put(partition, OffsetSpec.latest()));
        Map<TopicPartition, ListOffsetsResultInfo> latest = latestRequests.isEmpty()
                ? Map.of()
                : await(adminClient.listOffsets(latestRequests).all(), "read topic end offsets");

        List<ConsumerGroupDetails.PartitionOffset> offsets = committed.entrySet().stream()
                .sorted((left, right) -> {
                    int topicOrder = left.getKey().topic().compareTo(right.getKey().topic());
                    return topicOrder != 0 ? topicOrder
                            : Integer.compare(left.getKey().partition(), right.getKey().partition());
                })
                .map(entry -> toOffset(entry.getKey(), entry.getValue().offset(), latest.get(entry.getKey())))
                .toList();

        List<ConsumerGroupDetails.Member> members = description.members().stream()
                .map(member -> new ConsumerGroupDetails.Member(
                        member.consumerId(), member.clientId(), member.host(), member.assignment().topicPartitions().size()))
                .toList();
        return new ConsumerGroupDetails(groupId, description.state().name(), members.size(), members, offsets);
    }

    public void deleteInactiveGroup(String groupId, String confirmation, String actor) {
        requireManagedGroup(groupId);
        if (STREAMS_APPLICATION_ID.equals(groupId)) {
            throw new KafkaAdminOperationException(Failure.CONFLICT,
                    "The Kafka Streams application group is protected from direct deletion");
        }
        if (!("DELETE:" + groupId).equals(confirmation)) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST,
                    "Confirmation must exactly match DELETE:" + groupId);
        }
        ConsumerGroupDescription description = describe(groupId);
        if (!DELETABLE_STATES.contains(description.state().name())) {
            throw new KafkaAdminOperationException(Failure.CONFLICT,
                    "Consumer group must be EMPTY or DEAD before deletion; current state is " + description.state());
        }
        await(adminClient.deleteConsumerGroups(Set.of(groupId)).all(), "delete consumer group");
        log.warn("Kafka consumer group deleted: groupId={}, actor={}", groupId, actor);
    }

    public boolean hasActiveConsumerAssignedTo(String topicName) {
        Collection<ConsumerGroupListing> listings = await(adminClient.listConsumerGroups().all(), "list consumer groups");
        List<String> groupIds = listings.stream()
                .map(ConsumerGroupListing::groupId)
                .filter(KafkaConsumerGroupAdminService::isManagedGroup)
                .toList();
        if (groupIds.isEmpty()) {
            return false;
        }
        Map<String, ConsumerGroupDescription> descriptions = await(
                adminClient.describeConsumerGroups(groupIds).all(), "inspect topic consumers");
        return descriptions.values().stream()
                .filter(description -> description != null && !DELETABLE_STATES.contains(description.state().name()))
                .flatMap(description -> description.members().stream())
                .flatMap(member -> member.assignment().topicPartitions().stream())
                .anyMatch(partition -> partition.topic().equals(topicName));
    }

    private ConsumerGroupDescription describe(String groupId) {
        Map<String, ConsumerGroupDescription> descriptions = await(
                adminClient.describeConsumerGroups(Set.of(groupId)).all(), "describe consumer group");
        ConsumerGroupDescription description = descriptions.get(groupId);
        if (description == null) {
            throw new KafkaAdminOperationException(Failure.NOT_FOUND, "Consumer group not found: " + groupId);
        }
        return description;
    }

    private static ConsumerGroupSummary toSummary(String groupId, ConsumerGroupDescription description) {
        if (description == null) {
            throw new KafkaAdminOperationException(Failure.NOT_FOUND, "Consumer group disappeared during inspection: " + groupId);
        }
        return new ConsumerGroupSummary(groupId, description.state().name(), description.members().size());
    }

    private static ConsumerGroupDetails.PartitionOffset toOffset(
            TopicPartition topicPartition, long committedOffset, ListOffsetsResultInfo latest) {
        long endOffset = latest == null ? -1 : latest.offset();
        long lag = endOffset < 0 ? -1 : Math.max(0, endOffset - committedOffset);
        return new ConsumerGroupDetails.PartitionOffset(
                topicPartition.topic(), topicPartition.partition(), committedOffset, endOffset, lag);
    }

    private static boolean isManagedGroup(String groupId) {
        return groupId != null && MANAGED_GROUP_ID.matcher(groupId).matches();
    }

    private static void requireManagedGroup(String groupId) {
        if (!isManagedGroup(groupId)) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST,
                    "Only shopping application consumer groups can be managed");
        }
    }

    private <T> T await(Future<T> result, String operation) {
        try {
            return result.get(REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new KafkaAdminOperationException(Failure.BROKER_UNAVAILABLE,
                    "Interrupted while attempting to " + operation, exception);
        } catch (TimeoutException exception) {
            throw new KafkaAdminOperationException(Failure.BROKER_UNAVAILABLE,
                    "Timed out attempting to " + operation, exception);
        } catch (ExecutionException exception) {
            Throwable cause = exception.getCause();
            if (cause instanceof GroupIdNotFoundException) {
                throw new KafkaAdminOperationException(Failure.NOT_FOUND, "Consumer group not found", cause);
            }
            if (cause instanceof GroupNotEmptyException) {
                throw new KafkaAdminOperationException(Failure.CONFLICT, "Consumer group is still active", cause);
            }
            throw new KafkaAdminOperationException(Failure.BROKER_UNAVAILABLE,
                    "Kafka could not " + operation, cause);
        }
    }
}
