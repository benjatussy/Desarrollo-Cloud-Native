package com.shopping_list.categories.messaging.event;

public record ItemCreatedEvent(Long itemId, Long userId, String name) {}
