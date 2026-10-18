package com.shopping_list.items.messaging.event;

public record ItemCreatedEvent(Long itemId, Long userId, String name) {}
