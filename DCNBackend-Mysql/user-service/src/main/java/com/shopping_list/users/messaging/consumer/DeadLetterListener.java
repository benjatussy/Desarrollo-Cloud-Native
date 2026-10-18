package com.shopping_list.users.messaging.consumer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;

@Component
@Slf4j
public class DeadLetterListener {
    @RabbitListener(queues = "users.item-events.dlq")
    public void onDeadLetter(Message message) { logDeadLetter(message); }

    private void logDeadLetter(Message message) {
        var headers = message.getMessageProperties().getHeaders();
        log.error("Dead letter received: body={}, reason={}, sourceQueue={}, originalRoutingKey={}",
                new String(message.getBody(), StandardCharsets.UTF_8),
                headers.get("x-death"),
                headers.get("x-first-death-queue"),
                headers.get("x-first-death-routing-key"));
    }
}
