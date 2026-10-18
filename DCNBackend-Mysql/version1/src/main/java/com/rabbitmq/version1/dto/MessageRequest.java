package com.rabbitmq.version1.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private String exchange;
    private String routingKey;
    private String queueName;
    private String message;
}
