package com.shopping_list.categories.exception;

public class CategoryNotFoundException extends RuntimeException {

    public CategoryNotFoundException(Long id) {
        super("Category with id " + id + " not found");
    }
}
