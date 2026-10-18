package com.rabbitmq.version1.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.rabbitmq.version1.dto.ConsumedMessage;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderListener {

    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(
            id = "order-listener",
            queues = "orders.queue",
            containerFactory = "orderListenerFactory"
    )
    public void processOrder(String orderId) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        try {
            log.info("Procesando orden: {}", orderId);

            ConsumedMessage msg = new ConsumedMessage(
                    UUID.randomUUID().toString(),
                    "orders.queue",
                    "order-listener",
                    orderId,
                    timestamp,
                    "PROCESSING"
            );
            messagingTemplate.convertAndSend("/topic/messages", msg);

            Thread.sleep(2000);

            msg.setStatus("COMPLETED");
            messagingTemplate.convertAndSend("/topic/messages", msg);

            log.info("Orden procesada: {}", orderId);
        } catch (InterruptedException e) {
            log.error("Error: {}", orderId, e);
            Thread.currentThread().interrupt();

            ConsumedMessage errorMsg = new ConsumedMessage(
                    UUID.randomUUID().toString(),
                    "orders.queue",
                    "order-listener",
                    orderId,
                    timestamp,
                    "ERROR"
            );
            messagingTemplate.convertAndSend("/topic/messages", errorMsg);
        }
    }
}