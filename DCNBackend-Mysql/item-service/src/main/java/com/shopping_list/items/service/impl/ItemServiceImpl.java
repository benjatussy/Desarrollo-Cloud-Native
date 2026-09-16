package com.shopping_list.items.service.impl;

import com.shopping_list.items.dto.CreateItemRequest;
import com.shopping_list.items.dto.ItemResponse;
import com.shopping_list.items.dto.UpdateItemRequest;
import com.shopping_list.items.dto.UpdateItemStatusRequest;
import com.shopping_list.items.entity.Item;
import com.shopping_list.items.exception.ItemNotFoundException;
import com.shopping_list.items.mapper.ItemMapper;
import com.shopping_list.items.repository.ItemRepository;
import com.shopping_list.items.service.ItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final ItemMapper itemMapper;

    @Override
    public ItemResponse createItem(CreateItemRequest request) {
        Item item = itemMapper.toEntity(request);
        Item savedItem = itemRepository.save(item);
        return itemMapper.toResponse(savedItem);
    }

    @Override
    public List<ItemResponse> getAllItems() {
        return itemRepository.findAll()
                .stream()
                .map(itemMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ItemResponse> getItemsByUserId(Long userId) {
        return itemRepository.findByUserId(userId)
                .stream()
                .map(itemMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ItemResponse getItemById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));
        return itemMapper.toResponse(item);
    }

    @Override
    public ItemResponse updateItem(Long id, UpdateItemRequest request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));

        itemMapper.updateEntity(item, request);
        Item updatedItem = itemRepository.save(item);
        return itemMapper.toResponse(updatedItem);
    }

    @Override
    public ItemResponse updateItemStatus(Long id, UpdateItemStatusRequest request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));

        item.setPurchased(request.getPurchased());
        Item updatedItem = itemRepository.save(item);
        return itemMapper.toResponse(updatedItem);
    }

    @Override
    public void deleteItem(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));
        itemRepository.delete(item);
    }

}
