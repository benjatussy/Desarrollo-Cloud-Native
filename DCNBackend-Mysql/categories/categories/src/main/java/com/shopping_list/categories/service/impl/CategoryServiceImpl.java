package com.shopping_list.categories.service.impl;

import com.shopping_list.categories.dto.CategoryResponse;
import com.shopping_list.categories.dto.CreateCategoryRequest;
import com.shopping_list.categories.dto.UpdateCategoryRequest;
import com.shopping_list.categories.entity.Category;
import com.shopping_list.categories.exception.CategoryAlreadyExistsException;
import com.shopping_list.categories.exception.CategoryNotFoundException;
import com.shopping_list.categories.mapper.CategoryMapper;
import com.shopping_list.categories.repository.CategoryRepository;
import com.shopping_list.categories.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new CategoryAlreadyExistsException(request.getName());
        }

        Category category = categoryMapper.toEntity(request);
        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.toResponse(savedCategory);
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        return categoryMapper.toResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        Optional<Category> existingByName = categoryRepository.findByName(request.getName());
        if (existingByName.isPresent() && !existingByName.get().getId().equals(id)) {
            throw new CategoryAlreadyExistsException(request.getName());
        }

        categoryMapper.updateEntity(category, request);
        Category updatedCategory = categoryRepository.save(category);
        return categoryMapper.toResponse(updatedCategory);
    }

    @Override
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new CategoryNotFoundException(id);
        }
        categoryRepository.deleteById(id);
    }
}
