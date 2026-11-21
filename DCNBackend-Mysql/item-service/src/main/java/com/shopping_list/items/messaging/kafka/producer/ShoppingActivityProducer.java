package com.shopping_list.items.messaging.kafka.producer;

import com.shopping_list.items.messaging.kafka.event.ShoppingActivityEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Component
@Slf4j
public class ShoppingActivityProducer {

    private static final int EVENT_SCHEMA_VERSION = 1;
    private static final String ITEM_PURCHASED_EVENT_TYPE = "ITEM_PURCHASED";

    private final KafkaTemplate<String, ShoppingActivityEvent> kafkaTemplate;
    private final String topic;

    public ShoppingActivityProducer(
            KafkaTemplate<String, ShoppingActivityEvent> kafkaTemplate,
            @Value("${app.kafka.topics.shopping-activity-events}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void itemPurchased(Long itemId, Long userId) {
        ShoppingActivityEvent event = new ShoppingActivityEvent(
                UUID.randomUUID(),
                EVENT_SCHEMA_VERSION,
                ITEM_PURCHASED_EVENT_TYPE,
                Instant.now(),
                itemId,
                userId);
        String key = userId.toString();

        try {
            CompletableFuture<SendResult<String, ShoppingActivityEvent>> delivery =
                    kafkaTemplate.send(topic, key, event);
            delivery.whenComplete((result, failure) -> {
                if (failure != null) {
                    log.error("Kafka event delivery failed: topic={}, eventId={}, itemId={}",
                            topic, event.eventId(), itemId, failure);
                    return;
                }

                var metadata = result.getRecordMetadata();
                log.info("Kafka event delivered: topic={}, partition={}, offset={}, eventId={}",
                        metadata.topic(), metadata.partition(), metadata.offset(), event.eventId());
            });
        } catch (RuntimeException failure) {
            log.error("Kafka event could not be submitted: topic={}, eventId={}, itemId={}",
                    topic, event.eventId(), itemId, failure);
        }
    }
}
