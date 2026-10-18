package com.shopping_list.items.messaging.repository;

import com.shopping_list.items.messaging.entity.DeactivatedUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeactivatedUserRepository extends JpaRepository<DeactivatedUser, Long> {}
