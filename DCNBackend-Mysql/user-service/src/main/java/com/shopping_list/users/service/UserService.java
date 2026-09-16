package com.shopping_list.users.service;

import com.shopping_list.users.dto.*;

import java.util.List;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(Long id, UpdateUserRequest request);

    UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request);

    void deleteUser(Long id);
}
