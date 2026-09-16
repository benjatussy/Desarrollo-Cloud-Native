package com.shopping_list.categories.mapper;

import com.shopping_list.categories.dto.CategoryResponse;
import com.shopping_list.categories.dto.CreateCategoryRequest;
import com.shopping_list.categories.dto.UpdateCategoryRequest;
import com.shopping_list.categories.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CreateCategoryRequest request) {
        return Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
    }

    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .build();
    }

    public void updateEntity(Category category, UpdateCategoryRequest request) {
        category.setName(request.getName());
        category.setDescription(request.getDescription());
    }
}
