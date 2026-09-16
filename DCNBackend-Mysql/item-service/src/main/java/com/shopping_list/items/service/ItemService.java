package com.shopping_list.items.service;

import com.shopping_list.items.dto.CreateItemRequest;
import com.shopping_list.items.dto.ItemResponse;
import com.shopping_list.items.dto.UpdateItemRequest;
import com.shopping_list.items.dto.UpdateItemStatusRequest;

import java.util.List;

public interface ItemService {

    ItemResponse createItem(CreateItemRequest request);

    List<ItemResponse> getAllItems();

    List<ItemResponse> getItemsByUserId(Long userId);

    ItemResponse getItemById(Long id);

    ItemResponse updateItem(Long id, UpdateItemRequest request);

    ItemResponse updateItemStatus(Long id, UpdateItemStatusRequest request);

    void deleteItem(Long id);

}
