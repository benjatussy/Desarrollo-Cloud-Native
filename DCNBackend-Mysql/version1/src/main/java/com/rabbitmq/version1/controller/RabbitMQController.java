package com.rabbitmq.version1.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.QueueInformation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rabbitmq.version1.service.RabbitResourceManager;

import java.util.Map;

@RestController
@RequestMapping("/api/rabbitmq")
@RequiredArgsConstructor
public class RabbitMQController {

    private final RabbitResourceManager resourceManager;

    @PostMapping("/queues")
    public ResponseEntity<String> createQueue(@RequestParam String queueName) {
        resourceManager.createQueue(queueName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Cola '" + queueName + "' creada exitosamente");
    }

    @PostMapping("/exchanges")
    public ResponseEntity<String> createExchange(@RequestParam String exchangeName) {
        resourceManager.createExchange(exchangeName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Exchange '" + exchangeName + "' creado exitosamente");
    }

    @PostMapping("/bindings")
    public ResponseEntity<String> createBinding(
            @RequestParam String queueName,
            @RequestParam String exchangeName,
            @RequestParam String routingKey) {
        resourceManager.createBinding(queueName, exchangeName, routingKey);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Binding creado: " + queueName + " <-> " + exchangeName);
    }

    @GetMapping("/queues/{queueName}")
    public ResponseEntity<QueueInformation> getQueueInfo(@PathVariable String queueName) {
        QueueInformation info = resourceManager.getQueueInfo(queueName);
        return info != null
                ? ResponseEntity.ok(info)
                : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/queues/{queueName}")
    public ResponseEntity<String> deleteQueue(@PathVariable String queueName) {
        resourceManager.deleteQueue(queueName);
        return ResponseEntity.ok("Cola '" + queueName + "' eliminada");
    }

    @PostMapping("/queues/{queueName}/purge")
    public ResponseEntity<String> purgeQueue(@PathVariable String queueName) {
        resourceManager.purgeQueue(queueName);
        return ResponseEntity.ok("Cola '" + queueName + "' purgada");
    }

    @DeleteMapping("/exchanges/{exchangeName}")
    public ResponseEntity<String> deleteExchange(@PathVariable String exchangeName) {
        resourceManager.deleteExchange(exchangeName);
        return ResponseEntity.ok("Exchange '" + exchangeName + "' eliminado");
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = resourceManager.getConnectionHealth();
        return ResponseEntity.ok(health);
    }
}