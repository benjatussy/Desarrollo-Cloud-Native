package com.shopping_list.analytics.persistence;

import com.shopping_list.analytics.contract.ShoppingActivityMetric;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;

@Component
public class HourlyMetricConsumer {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HourlyMetricConsumer.class);

    private final JdbcTemplate jdbcTemplate;

    public HourlyMetricConsumer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @KafkaListener(topics = "${app.kafka.topics.shopping-activity-metrics}",
            groupId = "${spring.kafka.consumer.group-id}")
    public void consume(ShoppingActivityMetric metric,
                        @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        @Header(KafkaHeaders.OFFSET) long offset) {
        String bucketKey = metric.windowStart().toEpochMilli() + "|" + metric.shard();
        jdbcTemplate.update("""
                INSERT INTO hourly_shopping_metrics (bucket_key, window_start, shard, purchase_count)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE purchase_count = VALUES(purchase_count)
                """,
                bucketKey,
                Timestamp.from(metric.windowStart()),
                metric.shard(),
                metric.purchaseCount());
        log.info("Metric read model updated: topic={}, partition={}, offset={}, bucket={}, count={}",
                topic, partition, offset, bucketKey, metric.purchaseCount());
    }
}
