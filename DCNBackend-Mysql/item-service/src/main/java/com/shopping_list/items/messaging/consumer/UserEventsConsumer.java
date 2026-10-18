package com.shopping_list.items.messaging.consumer;

import com.shopping_list.items.messaging.event.*;
import com.shopping_list.items.messaging.repository.DeactivatedUserRepository;
import com.shopping_list.items.repository.ItemRepository;
import com.shopping_list.items.messaging.entity.DeactivatedUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventsConsumer {
    private final DeactivatedUserRepository deactivatedUserRepository;
    private final ItemRepository itemRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = "items.user-events.queue")
    @Transactional
    public void onUserEvent(Message message) throws Exception {
        String routingKey = message.getMessageProperties().getReceivedRoutingKey();
        switch (routingKey) {
            case "user.created" -> {
                UserCreatedEvent event = objectMapper.readValue(message.getBody(), UserCreatedEvent.class);
                rejectDemoUser(event.userId());
                deactivatedUserRepository.deleteById(event.userId());
                log.info("Consumed user.created: userId={}", event.userId());
            }
            case "user.deactivated" -> {
                UserDeactivatedEvent event = objectMapper.readValue(message.getBody(), UserDeactivatedEvent.class);
                rejectDemoUser(event.userId());
                deactivatedUserRepository.save(new DeactivatedUser(event.userId()));
                log.info("Consumed user.deactivated: blocked new items for userId={}", event.userId());
            }
            case "user.deleted" -> {
                UserDeletedEvent event = objectMapper.readValue(message.getBody(), UserDeletedEvent.class);
                rejectDemoUser(event.userId());
                itemRepository.deleteByUserId(event.userId());
                deactivatedUserRepository.deleteById(event.userId());
                log.info("Consumed user.deleted: removed items for userId={}", event.userId());
            }
            default -> throw new IllegalArgumentException("Unsupported user event routing key: " + routingKey);
        }
    }
    private void rejectDemoUser(Long userId) {
        if (Long.valueOf(999L).equals(userId)) throw new IllegalStateException("Demonstration failure for userId=999");
    }
}
