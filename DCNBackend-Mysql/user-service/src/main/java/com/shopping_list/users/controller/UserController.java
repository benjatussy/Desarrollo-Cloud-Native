package com.shopping_list.users.controller;

import com.shopping_list.users.dto.*;
import com.shopping_list.users.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasAuthority('SCOPE_Users.Write')")
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PreAuthorize("hasAuthority('SCOPE_Users.Read')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAuthority('SCOPE_Users.Read')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> response = userService.getAllUsers();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAuthority('SCOPE_Users.Write')")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id,
                                                   @Valid @RequestBody UpdateUserRequest request) {
        UserResponse response = userService.updateUser(id, request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAuthority('SCOPE_Users.Write')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(@PathVariable Long id,
                                                         @Valid @RequestBody UpdateUserStatusRequest request) {
        UserResponse response = userService.updateUserStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAuthority('SCOPE_Users.Write')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
