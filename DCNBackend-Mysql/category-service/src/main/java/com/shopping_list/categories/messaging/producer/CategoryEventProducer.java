package com.shopping_list.categories.messaging.producer;

import com.shopping_list.categories.messaging.config.RabbitConfig;
import com.shopping_list.categories.messaging.event.CategoryDeletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CategoryEventProducer {
    private final RabbitTemplate rabbitTemplate;
    public void categoryDeleted(Long categoryId) {
        CategoryDeletedEvent event = new CategoryDeletedEvent(categoryId);
        rabbitTemplate.convertAndSend(RabbitConfig.EVENTS_EXCHANGE, "category.deleted", event);
        log.info("Published event routingKey=category.deleted event={}", event);
    }
}
