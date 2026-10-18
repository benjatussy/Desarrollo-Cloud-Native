package com.shopping_list.categories.messaging.consumer;

import com.shopping_list.categories.messaging.event.ItemCreatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ItemEventsConsumer {
    @RabbitListener(queues = "categories.item-events.queue")
    public void onItemCreated(ItemCreatedEvent event) {
        if (Long.valueOf(999L).equals(event.userId())) throw new IllegalStateException("Demonstration failure for userId=999");
        log.info("Consumed item.created: itemId={}, userId={}, name={}", event.itemId(), event.userId(), event.name());
    }
}
