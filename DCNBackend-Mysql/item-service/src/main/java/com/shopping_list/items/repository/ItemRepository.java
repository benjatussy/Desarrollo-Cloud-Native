package com.shopping_list.items.repository;

import com.shopping_list.items.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByUserId(Long userId);

}
