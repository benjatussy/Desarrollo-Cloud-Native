package com.shopping_list.users.messaging.producer;

import com.shopping_list.users.messaging.config.RabbitConfig;
import com.shopping_list.users.messaging.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventProducer {
    private final RabbitTemplate rabbitTemplate;
    public void userCreated(Long userId) { publish("user.created", new UserCreatedEvent(userId)); }
    public void userDeactivated(Long userId) { publish("user.deactivated", new UserDeactivatedEvent(userId)); }
    public void userDeleted(Long userId) { publish("user.deleted", new UserDeletedEvent(userId)); }
    private void publish(String key, Object event) {
        rabbitTemplate.convertAndSend(RabbitConfig.EVENTS_EXCHANGE, key, event);
        log.info("Published event routingKey={} event={}", key, event);
    }
}
