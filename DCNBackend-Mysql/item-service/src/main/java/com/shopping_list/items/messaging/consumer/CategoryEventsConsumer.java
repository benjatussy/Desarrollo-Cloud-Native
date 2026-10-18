package com.shopping_list.items.messaging.consumer;

import com.shopping_list.items.messaging.event.CategoryDeletedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CategoryEventsConsumer {
    @RabbitListener(queues = "items.category-events.queue")
    public void onCategoryDeleted(CategoryDeletedEvent event) {
        log.info("Consumed category.deleted cleanup notification for categoryId={}", event.categoryId());
    }
}
