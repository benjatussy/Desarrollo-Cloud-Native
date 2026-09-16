package com.shopping_list.items.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemResponse {

    private Long id;
    private String name;
    private Integer quantity;
    private Double price;
    private Boolean purchased;
    private Long userId;
    private LocalDateTime createdAt;

}
