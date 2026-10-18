package com.shopping_list.users.messaging.consumer;

import com.shopping_list.users.messaging.event.ItemPurchasedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ItemEventsConsumer {
    @RabbitListener(queues = "users.item-events.queue")
    public void onItemPurchased(ItemPurchasedEvent event) {
        log.info("Consumed item.purchased: userId={}, itemId={}", event.userId(), event.itemId());
    }
}
