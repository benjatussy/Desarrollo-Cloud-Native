package com.rabbitmq.version1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConsumedMessage {
    private String id;
    private String queue;
    private String listenerId;
    private String content;
    private String timestamp;
    private String status;
}
