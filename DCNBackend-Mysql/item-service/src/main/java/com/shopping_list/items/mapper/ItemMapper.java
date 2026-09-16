package com.shopping_list.items.mapper;

import com.shopping_list.items.dto.CreateItemRequest;
import com.shopping_list.items.dto.ItemResponse;
import com.shopping_list.items.dto.UpdateItemRequest;
import com.shopping_list.items.entity.Item;
import org.springframework.stereotype.Component;

@Component
public class ItemMapper {

    public Item toEntity(CreateItemRequest request) {
        return Item.builder()
                .name(request.getName())
                .quantity(request.getQuantity())
                .price(request.getPrice())
                .userId(request.getUserId())
                .build();
    }

    public ItemResponse toResponse(Item item) {
        return ItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .purchased(item.getPurchased())
                .userId(item.getUserId())
                .createdAt(item.getCreatedAt())
                .build();
    }

    public void updateEntity(Item item, UpdateItemRequest request) {
        item.setName(request.getName());
        item.setQuantity(request.getQuantity());
        item.setPrice(request.getPrice());
    }

}
