package com.shopping_list.users.mapper;

import com.shopping_list.users.dto.UserResponse;
import com.shopping_list.users.entity.User;

public class UserMapper {

    private UserMapper() {
        // Utility class — prevent instantiation
    }

    public static UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
