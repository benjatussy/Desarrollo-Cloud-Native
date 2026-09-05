# Documentación de Endpoints de la API

Este documento detalla todos los endpoints disponibles en los microservicios: **Users**, **Categories** e **Items**, especificando el método HTTP, la URL, parámetros/cuerpo de entrada, código de respuesta HTTP y la estructura exacta de los datos que retorna.

---

## 1. Microservicio de Categorías (`categories-service`)
* **Puerto base por defecto:** `8083`
* **Prefijo base:** `/categories`
* **Controlador:** [`CategoryController.java`](file:///c:/Users/javie/OneDrive/Desktop/DCN/categories/categories/src/main/java/com/shopping_list/categories/controller/CategoryController.java)

### 1.1 Crear Categoría
* **Método:** `POST`
* **Ruta:** `/categories`
* **Request Body:**
  ```json
  {
    "name": "Lácteos",         // (Obligatorio, String 2-100 caracteres)
    "description": "Leche..."  // (Opcional, String máx 255 caracteres)
  }
  ```
* **Respuesta HTTP:** `201 Created`
* **Datos que regresa (`CategoryResponse`):**
  ```json
  {
    "id": 1,
    "name": "Lácteos",
    "description": "Leche...",
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 1.2 Obtener Todas las Categorías
* **Método:** `GET`
* **Ruta:** `/categories`
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`List<CategoryResponse>`):**
  ```json
  [
    {
      "id": 1,
      "name": "Lácteos",
      "description": "Leche y derivados",
      "createdAt": "2026-09-03T19:25:00"
    }
  ]
  ```

### 1.3 Obtener Categoría por ID
* **Método:** `GET`
* **Ruta:** `/categories/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`CategoryResponse`):**
  ```json
  {
    "id": 1,
    "name": "Lácteos",
    "description": "Leche y derivados",
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 1.4 Actualizar Categoría
* **Método:** `PUT`
* **Ruta:** `/categories/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Request Body:**
  ```json
  {
    "name": "Lácteos y Derivados",
    "description": "Nueva descripción"
  }
  ```
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`CategoryResponse`):**
  ```json
  {
    "id": 1,
    "name": "Lácteos y Derivados",
    "description": "Nueva descripción",
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 1.5 Eliminar Categoría
* **Método:** `DELETE`
* **Ruta:** `/categories/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Respuesta HTTP:** `204 No Content`
* **Datos que regresa:** Vacío (`Void` / Sin cuerpo).

---

## 2. Microservicio de Usuarios (`users-service`)
* **Puerto base por defecto:** `8081`
* **Prefijo base:** `/users`
* **Controlador:** [`UserController.java`](file:///c:/Users/javie/OneDrive/Desktop/DCN/user/user/src/main/java/com/shopping_list/users/controller/UserController.java)

### 2.1 Crear Usuario
* **Método:** `POST`
* **Ruta:** `/users`
* **Request Body:**
  ```json
  {
    "name": "Carlos Perez",           // (Obligatorio, String 2-100 caracteres)
    "email": "carlos@example.com",     // (Obligatorio, Formato email válido, máx 150 caracteres)
    "password": "miPassword123"        // (Obligatorio, String 8-255 caracteres)
  }
  ```
* **Respuesta HTTP:** `201 Created`
* **Datos que regresa (`UserResponse`):**
  ```json
  {
    "id": 1,
    "name": "Carlos Perez",
    "email": "carlos@example.com",
    "active": true,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```
  *(Nota: El password nunca se retorna).*

### 2.2 Obtener Todos los Usuarios
* **Método:** `GET`
* **Ruta:** `/users`
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`List<UserResponse>`):**
  ```json
  [
    {
      "id": 1,
      "name": "Carlos Perez",
      "email": "carlos@example.com",
      "active": true,
      "createdAt": "2026-09-03T19:25:00"
    }
  ]
  ```

### 2.3 Obtener Usuario por ID
* **Método:** `GET`
* **Ruta:** `/users/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`UserResponse`):**
  ```json
  {
    "id": 1,
    "name": "Carlos Perez",
    "email": "carlos@example.com",
    "active": true,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 2.4 Actualizar Usuario
* **Método:** `PUT`
* **Ruta:** `/users/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Request Body:**
  ```json
  {
    "name": "Carlos Alberto Perez",
    "email": "carlos.alberto@example.com"
  }
  ```
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`UserResponse`):**
  ```json
  {
    "id": 1,
    "name": "Carlos Alberto Perez",
    "email": "carlos.alberto@example.com",
    "active": true,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 2.5 Actualizar Estado del Usuario (Activar/Desactivar)
* **Método:** `PATCH`
* **Ruta:** `/users/{id}/status`
* **Parámetros:** `id` (Long, Path Variable)
* **Request Body:**
  ```json
  {
    "active": false                   // (Obligatorio, Boolean)
  }
  ```
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`UserResponse`):**
  ```json
  {
    "id": 1,
    "name": "Carlos Alberto Perez",
    "email": "carlos.alberto@example.com",
    "active": false,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 2.6 Eliminar Usuario
* **Método:** `DELETE`
* **Ruta:** `/users/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Respuesta HTTP:** `204 No Content`
* **Datos que regresa:** Vacío (`Void` / Sin cuerpo).

---

## 3. Microservicio de Items (`items-service`)
* **Puerto base por defecto:** `8082`
* **Prefijo base:** `/items`
* **Controlador:** [`ItemController.java`](file:///c:/Users/javie/OneDrive/Desktop/DCN/item/item/src/main/java/com/shopping_list/items/controller/ItemController.java)

### 3.1 Crear Item
* **Método:** `POST`
* **Ruta:** `/items`
* **Request Body:**
  ```json
  {
    "name": "Leche entera 1L",       // (Obligatorio, String 1-255 caracteres)
    "quantity": 2,                   // (Obligatorio, Integer >= 1)
    "price": 1.25,                   // (Obligatorio, Double >= 0.0)
    "userId": 1                      // (Obligatorio, Long)
  }
  ```
* **Respuesta HTTP:** `201 Created`
* **Datos que regresa (`ItemResponse`):**
  ```json
  {
    "id": 1,
    "name": "Leche entera 1L",
    "quantity": 2,
    "price": 1.25,
    "purchased": false,
    "userId": 1,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 3.2 Obtener Todos los Items
* **Método:** `GET`
* **Ruta:** `/items`
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`List<ItemResponse>`):**
  ```json
  [
    {
      "id": 1,
      "name": "Leche entera 1L",
      "quantity": 2,
      "price": 1.25,
      "purchased": false,
      "userId": 1,
      "createdAt": "2026-09-03T19:25:00"
    }
  ]
  ```

### 3.3 Obtener Items por ID de Usuario
* **Método:** `GET`
* **Ruta:** `/items/user/{userId}`
* **Parámetros:** `userId` (Long, Path Variable)
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`List<ItemResponse>`):**
  ```json
  [
    {
      "id": 1,
      "name": "Leche entera 1L",
      "quantity": 2,
      "price": 1.25,
      "purchased": false,
      "userId": 1,
      "createdAt": "2026-09-03T19:25:00"
    }
  ]
  ```

### 3.4 Obtener Item por ID
* **Método:** `GET`
* **Ruta:** `/items/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`ItemResponse`):**
  ```json
  {
    "id": 1,
    "name": "Leche entera 1L",
    "quantity": 2,
    "price": 1.25,
    "purchased": false,
    "userId": 1,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 3.5 Actualizar Item Completo
* **Método:** `PUT`
* **Ruta:** `/items/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Request Body:**
  ```json
  {
    "name": "Leche descremada 1L",    // (Obligatorio, String 1-255 caracteres)
    "quantity": 3,                    // (Obligatorio, Integer >= 1)
    "price": 1.30                     // (Obligatorio, Double >= 0.0)
  }
  ```
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`ItemResponse`):**
  ```json
  {
    "id": 1,
    "name": "Leche descremada 1L",
    "quantity": 3,
    "price": 1.30,
    "purchased": false,
    "userId": 1,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 3.6 Actualizar Estado de Compra del Item (`purchased`)
* **Método:** `PATCH`
* **Ruta:** `/items/{id}/purchased`
* **Parámetros:** `id` (Long, Path Variable)
* **Request Body:**
  ```json
  {
    "purchased": true                 // (Obligatorio, Boolean)
  }
  ```
* **Respuesta HTTP:** `200 OK`
* **Datos que regresa (`ItemResponse`):**
  ```json
  {
    "id": 1,
    "name": "Leche entera 1L",
    "quantity": 2,
    "price": 1.25,
    "purchased": true,
    "userId": 1,
    "createdAt": "2026-09-03T19:25:00"
  }
  ```

### 3.7 Eliminar Item
* **Método:** `DELETE`
* **Ruta:** `/items/{id}`
* **Parámetros:** `id` (Long, Path Variable)
* **Respuesta HTTP:** `204 No Content`
* **Datos que regresa:** Vacío (`Void` / Sin cuerpo).
