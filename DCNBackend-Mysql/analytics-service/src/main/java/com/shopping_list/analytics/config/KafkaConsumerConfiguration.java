package com.shopping_list.analytics.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConsumerConfiguration {

    private static final int TOPIC_PARTITIONS = 3;
    private static final short TOPIC_REPLICATION_FACTOR = 3;
    private static final long TOPIC_RETENTION_MILLIS = 604_800_000L;

    @Bean
    public NewTopic metricsTopic(@Value("${app.kafka.topics.shopping-activity-metrics}") String topic) {
        return topic(topic);
    }

    @Bean
    public NewTopic invalidActivityTopic(@Value("${app.kafka.topics.shopping-activity-events-dlt}") String topic) {
        return topic(topic);
    }

    @Bean
    public NewTopic metricsDeadLetterTopic(@Value("${app.kafka.topics.shopping-activity-metrics-dlt}") String topic) {
        return topic(topic);
    }

    @Bean
    public CommonErrorHandler metricConsumerErrorHandler(KafkaTemplate<Object, Object> kafkaTemplate,
                                                          @Value("${app.kafka.topics.shopping-activity-metrics-dlt}") String deadLetterTopic) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafkaTemplate,
                (record, exception) -> new org.apache.kafka.common.TopicPartition(deadLetterTopic, record.partition()));
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 2L));
    }

    private NewTopic topic(String name) {
        return TopicBuilder.name(name)
                .partitions(TOPIC_PARTITIONS)
                .replicas(TOPIC_REPLICATION_FACTOR)
                .config("retention.ms", Long.toString(TOPIC_RETENTION_MILLIS))
                .config("cleanup.policy", "delete")
                .config("min.insync.replicas", "2")
                .build();
    }
}
