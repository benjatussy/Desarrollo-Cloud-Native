package com.shopping_list.analytics.admin.topic;

import com.shopping_list.analytics.admin.error.KafkaAdminOperationException;
import com.shopping_list.analytics.admin.error.KafkaAdminOperationException.Failure;
import com.shopping_list.analytics.admin.group.KafkaConsumerGroupAdminService;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AlterConfigOp;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.Node;
import org.apache.kafka.common.config.ConfigResource;
import org.apache.kafka.common.errors.TopicExistsException;
import org.apache.kafka.common.errors.UnknownTopicOrPartitionException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class KafkaTopicAdminService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(KafkaTopicAdminService.class);
    private static final Pattern MANAGED_TOPIC_NAME = Pattern.compile("shopping-(activity|analytics)-[a-z0-9][a-z0-9.-]{0,180}");
    private static final int MAX_PARTITIONS = 24;
    private static final int MIN_PARTITIONS = 1;
    private static final short MIN_REPLICATION_FACTOR = 2;
    private static final long REQUEST_TIMEOUT_SECONDS = 10;
    private static final long MIN_RETENTION_MILLIS = 60_000L;
    private static final long MAX_RETENTION_MILLIS = 7_776_000_000L;
    private static final String MIN_IN_SYNC_REPLICAS = "2";
    private static final String STREAMS_INTERNAL_TOPIC_PREFIX = "shopping-activity-streams-v1-";

    private final AdminClient adminClient;
    private final KafkaConsumerGroupAdminService groupAdminService;

    public KafkaTopicAdminService(AdminClient adminClient, KafkaConsumerGroupAdminService groupAdminService) {
        this.adminClient = adminClient;
        this.groupAdminService = groupAdminService;
    }

    public List<String> listTopics() {
        return await(adminClient.listTopics(new ListTopicsOptions().listInternal(false)).names(),
                        "list topics").stream()
                .filter(KafkaTopicAdminService::isManagedTopic)
                .sorted()
                .toList();
    }

    public TopicDetails describeTopic(String name) {
        requireManagedTopic(name);
        TopicDescription description = await(adminClient.describeTopics(Set.of(name)).allTopicNames(), "describe topic")
                .get(name);
        if (description == null) {
            throw new KafkaAdminOperationException(Failure.NOT_FOUND, "Topic not found: " + name);
        }

        ConfigResource resource = topicResource(name);
        Config config = await(adminClient.describeConfigs(Set.of(resource)).all(), "describe topic config").get(resource);
        Map<String, String> configs = config.entries().stream()
                .filter(entry -> !entry.isSensitive() && entry.value() != null)
                .collect(Collectors.toUnmodifiableMap(ConfigEntry::name, ConfigEntry::value));
        List<TopicDetails.PartitionDetails> partitions = description.partitions().stream()
                .map(partition -> new TopicDetails.PartitionDetails(
                        partition.partition(),
                        partition.leader() == null ? null : partition.leader().id(),
                        nodeIds(partition.replicas()),
                        nodeIds(partition.isr())))
                .toList();
        return new TopicDetails(name, description.isInternal(), partitions, configs);
    }

    public void createTopic(TopicCreateRequest request, String actor) {
        requireManagedTopic(request.name());
        validateTopicConfig(request.partitions(), request.retentionMs(), request.cleanupPolicy());
        if (request.partitions() > MAX_PARTITIONS) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST, "Maximum partitions allowed: " + MAX_PARTITIONS);
        }
        Collection<Node> brokers = await(adminClient.describeCluster().nodes(), "describe brokers");
        if (request.replicationFactor() < MIN_REPLICATION_FACTOR || request.replicationFactor() > brokers.size()) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST,
                    "replicationFactor must be between " + MIN_REPLICATION_FACTOR + " and available broker count " + brokers.size());
        }
        NewTopic topic = new NewTopic(request.name(), request.partitions(), request.replicationFactor())
                .configs(Map.of(
                        "retention.ms", Long.toString(request.retentionMs()),
                        "cleanup.policy", request.cleanupPolicy(),
                        "min.insync.replicas", MIN_IN_SYNC_REPLICAS));
        await(adminClient.createTopics(List.of(topic)).all(), "create topic");
        log.info("Kafka topic created: topic={}, partitions={}, replicationFactor={}, actor={}",
                request.name(), request.partitions(), request.replicationFactor(), actor);
    }

    public void updateTopicConfig(String name, TopicConfigUpdateRequest request, String actor) {
        requireManagedTopic(name);
        if (!request.hasChanges()) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST, "At least one allowed config must be provided");
        }
        if (request.retentionMs() != null
                && (request.retentionMs() < MIN_RETENTION_MILLIS || request.retentionMs() > MAX_RETENTION_MILLIS)) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST, "retentionMs is outside the allowed range");
        }
        if (request.cleanupPolicy() != null && !isAllowedCleanupPolicy(request.cleanupPolicy())) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST, "cleanupPolicy must be delete or compact");
        }
        describeTopic(name);
        List<AlterConfigOp> changes = new ArrayList<>();
        if (request.retentionMs() != null) {
            changes.add(new AlterConfigOp(new ConfigEntry("retention.ms", request.retentionMs().toString()), AlterConfigOp.OpType.SET));
        }
        if (request.cleanupPolicy() != null) {
            changes.add(new AlterConfigOp(new ConfigEntry("cleanup.policy", request.cleanupPolicy()), AlterConfigOp.OpType.SET));
        }
        Map<ConfigResource, Collection<AlterConfigOp>> changesByResource = Map.of(topicResource(name), changes);
        await(adminClient.incrementalAlterConfigs(changesByResource).all(), "update topic config");
        log.info("Kafka topic config updated: topic={}, retentionMs={}, cleanupPolicy={}, actor={}",
                name, request.retentionMs(), request.cleanupPolicy(), actor);
    }

    public void deleteTopic(String name, String confirmation, String actor) {
        requireManagedTopic(name);
        requireConfirmation(confirmation, "DELETE:" + name);
        describeTopic(name);
        if (groupAdminService.hasActiveConsumerAssignedTo(name)) {
            throw new KafkaAdminOperationException(Failure.CONFLICT,
                    "Topic has active shopping consumer assignments and cannot be deleted");
        }
        await(adminClient.deleteTopics(List.of(name)).all(), "delete topic");
        log.warn("Kafka topic deleted: topic={}, actor={}", name, actor);
    }

    static boolean isManagedTopic(String name) {
        return MANAGED_TOPIC_NAME.matcher(name).matches()
                && !name.equals("shopping-activity-streams-v1")
                && !name.startsWith(STREAMS_INTERNAL_TOPIC_PREFIX);
    }

    static void requireManagedTopic(String name) {
        if (name == null || !isManagedTopic(name)) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST,
                    "Only shopping activity/analytics topics can be managed");
        }
    }

    static void requireConfirmation(String supplied, String expected) {
        if (!expected.equals(supplied)) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST, "Confirmation must exactly match " + expected);
        }
    }

    private static void validateTopicConfig(int partitions, long retentionMillis, String cleanupPolicy) {
        if (partitions < MIN_PARTITIONS || partitions > MAX_PARTITIONS) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST,
                    "partitions must be between " + MIN_PARTITIONS + " and " + MAX_PARTITIONS);
        }
        if (retentionMillis < MIN_RETENTION_MILLIS || retentionMillis > MAX_RETENTION_MILLIS) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST, "retentionMs is outside the allowed range");
        }
        if (!isAllowedCleanupPolicy(cleanupPolicy)) {
            throw new KafkaAdminOperationException(Failure.INVALID_REQUEST, "cleanupPolicy must be delete or compact");
        }
    }

    private static boolean isAllowedCleanupPolicy(String cleanupPolicy) {
        return "delete".equals(cleanupPolicy) || "compact".equals(cleanupPolicy);
    }

    static ConfigResource topicResource(String name) {
        return new ConfigResource(ConfigResource.Type.TOPIC, name);
    }

    private static List<Integer> nodeIds(List<Node> nodes) {
        return nodes.stream().map(Node::id).toList();
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
            if (cause instanceof TopicExistsException) {
                throw new KafkaAdminOperationException(Failure.CONFLICT, "Topic already exists", cause);
            }
            if (cause instanceof UnknownTopicOrPartitionException) {
                throw new KafkaAdminOperationException(Failure.NOT_FOUND, "Topic not found", cause);
            }
            throw new KafkaAdminOperationException(Failure.BROKER_UNAVAILABLE, "Kafka could not " + operation, cause);
        }
    }
}
