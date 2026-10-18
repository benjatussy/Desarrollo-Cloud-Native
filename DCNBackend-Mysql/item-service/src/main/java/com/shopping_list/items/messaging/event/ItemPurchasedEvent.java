package com.shopping_list.items.messaging.event;

public record ItemPurchasedEvent(Long itemId, Long userId) {}
