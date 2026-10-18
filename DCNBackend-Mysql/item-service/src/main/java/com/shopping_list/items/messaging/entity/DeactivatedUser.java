package com.shopping_list.items.messaging.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "deactivated_users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DeactivatedUser {
    @Id
    private Long userId;
}
