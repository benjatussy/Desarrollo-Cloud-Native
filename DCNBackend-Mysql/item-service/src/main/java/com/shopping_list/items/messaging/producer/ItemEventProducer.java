package com.shopping_list.items.messaging.producer;

import com.shopping_list.items.messaging.config.RabbitConfig;
import com.shopping_list.items.messaging.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ItemEventProducer {
    private final RabbitTemplate rabbitTemplate;
    public void itemCreated(ItemCreatedEvent event) { publish("item.created", event); }
    public void itemPurchased(ItemPurchasedEvent event) { publish("item.purchased", event); }
    private void publish(String key, Object event) {
        rabbitTemplate.convertAndSend(RabbitConfig.EVENTS_EXCHANGE, key, event);
        log.info("Published event routingKey={} event={}", key, event);
    }
}
