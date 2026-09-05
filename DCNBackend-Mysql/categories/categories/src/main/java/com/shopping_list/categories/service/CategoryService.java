package com.shopping_list.categories.service;

import com.shopping_list.categories.dto.CategoryResponse;
import com.shopping_list.categories.dto.CreateCategoryRequest;
import com.shopping_list.categories.dto.UpdateCategoryRequest;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CreateCategoryRequest request);

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategoryById(Long id);

    CategoryResponse updateCategory(Long id, UpdateCategoryRequest request);

    void deleteCategory(Long id);
}
