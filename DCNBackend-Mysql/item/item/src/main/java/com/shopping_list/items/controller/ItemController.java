package com.shopping_list.items.controller;

import com.shopping_list.items.dto.CreateItemRequest;
import com.shopping_list.items.dto.ItemResponse;
import com.shopping_list.items.dto.UpdateItemRequest;
import com.shopping_list.items.dto.UpdateItemStatusRequest;
import com.shopping_list.items.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @PreAuthorize("hasAuthority('SCOPE_Items.Write')")
    @PostMapping
    public ResponseEntity<ItemResponse> createItem(@Valid @RequestBody CreateItemRequest request) {
        ItemResponse response = itemService.createItem(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('SCOPE_Items.Read')")
    @GetMapping
    public ResponseEntity<List<ItemResponse>> getAllItems() {
        List<ItemResponse> items = itemService.getAllItems();
        return ResponseEntity.ok(items);
    }

    @PreAuthorize("hasAuthority('SCOPE_Items.Read')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ItemResponse>> getItemsByUserId(@PathVariable Long userId) {
        List<ItemResponse> items = itemService.getItemsByUserId(userId);
        return ResponseEntity.ok(items);
    }

    @PreAuthorize("hasAuthority('SCOPE_Items.Read')")
    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Long id) {
        ItemResponse item = itemService.getItemById(id);
        return ResponseEntity.ok(item);
    }

    @PreAuthorize("hasAuthority('SCOPE_Items.Write')")
    @PutMapping("/{id}")
    public ResponseEntity<ItemResponse> updateItem(@PathVariable Long id,
                                                    @Valid @RequestBody UpdateItemRequest request) {
        ItemResponse response = itemService.updateItem(id, request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAuthority('SCOPE_Items.Write')")
    @PatchMapping("/{id}/purchased")
    public ResponseEntity<ItemResponse> updateItemStatus(@PathVariable Long id,
                                                          @Valid @RequestBody UpdateItemStatusRequest request) {
        ItemResponse response = itemService.updateItemStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAuthority('SCOPE_Items.Write')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

}
