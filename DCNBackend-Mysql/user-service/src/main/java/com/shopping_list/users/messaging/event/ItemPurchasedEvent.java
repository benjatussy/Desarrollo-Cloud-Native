package com.shopping_list.users.messaging.event;

public record ItemPurchasedEvent(Long itemId, Long userId) {}
