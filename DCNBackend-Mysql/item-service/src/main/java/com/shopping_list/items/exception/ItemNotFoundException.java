package com.shopping_list.items.exception;

public class ItemNotFoundException extends RuntimeException {

    public ItemNotFoundException(Long id) {
        super("Item with id " + id + " not found");
    }

}
