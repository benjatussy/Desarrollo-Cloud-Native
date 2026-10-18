package com.rabbitmq.version1.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rabbitmq.version1.dto.MessageRequest;
import com.rabbitmq.version1.service.MessageService;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<String> sendMessage(@RequestBody MessageRequest request) {
        messageService.sendMessage(request);
        return ResponseEntity.ok("Mensaje enviado exitosamente");
    }
}
