package com.rabbitmq.version1.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.rabbitmq.version1.dto.MessageRequest;

@Service
@Slf4j
@RequiredArgsConstructor
public class MessageService {

    private final RabbitTemplate rabbitTemplate;

    public void sendMessage(MessageRequest request) {
        try {
            if (request.getExchange() != null && !request.getExchange().isBlank()) {
                String routingKey = request.getRoutingKey() != null ? request.getRoutingKey() : "";
                rabbitTemplate.convertAndSend(request.getExchange(), routingKey, request.getMessage());
                log.info("Mensaje enviado al exchange '{}' con routing key '{}': {}",
                        request.getExchange(), routingKey, request.getMessage());
            } else if (request.getQueueName() != null && !request.getQueueName().isBlank()) {
                rabbitTemplate.convertAndSend("", request.getQueueName(), request.getMessage());
                log.info("Mensaje enviado a la cola '{}': {}", request.getQueueName(), request.getMessage());
            } else {
                throw new IllegalArgumentException("Debe especificar un exchange o un nombre de cola");
            }
        } catch (Exception e) {
            log.error("Error al enviar mensaje: {}", e.getMessage());
            throw new RuntimeException("Error al enviar mensaje: " + e.getMessage(), e);
        }
    }
}
