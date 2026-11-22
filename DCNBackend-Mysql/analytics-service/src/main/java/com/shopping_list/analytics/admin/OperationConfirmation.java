package com.shopping_list.analytics.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OperationConfirmation(@NotBlank @Size(max = 250) String confirmation) {
}
