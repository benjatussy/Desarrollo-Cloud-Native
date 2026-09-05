-- ==========================================================
-- SCRIPT DE INSERCIÓN DE DATOS DE PRUEBA (MySQL)
-- ==========================================================

-- ----------------------------------------------------------
-- 1. BASE DE DATOS: users_db
-- Entidad: User (tabla 'users')
-- ----------------------------------------------------------
USE users_db;

INSERT INTO users (id, name, email, password, active, created_at) VALUES
(1, 'Carlos Perez', 'carlos.perez@example.com', 'pass1234', true, NOW()),
(2, 'Maria Gomez', 'maria.gomez@example.com', 'pass1234', true, NOW()),
(3, 'Juan Rodriguez', 'juan.rodriguez@example.com', 'pass1234', true, NOW()),
(4, 'Laura Fernandez', 'laura.fernandez@example.com', 'pass1234', false, NOW());


-- ----------------------------------------------------------
-- 2. BASE DE DATOS: categories_db
-- Entidad: Category (tabla 'categories')
-- ----------------------------------------------------------
USE categories_db;

INSERT INTO categories (id, name, description, created_at) VALUES
(1, 'Lácteos y Huevos', 'Leche, quesos, yogures, mantequilla y huevos', NOW()),
(2, 'Frutas y Verduras', 'Productos frescos de huerta y frutas de temporada', NOW()),
(3, 'Carnes y Pescados', 'Carnes rojas, pollo, cerdo, pescados y mariscos', NOW()),
(4, 'Bebidas', 'Aguas, jugos, gaseosas, café e infusiones', NOW()),
(5, 'Limpieza y Hogar', 'Artículos para el aseo del hogar y detergentes', NOW()),
(6, 'Panadería y Snacks', 'Pan fresco, galletas, tostadas y aperitivos', NOW());


-- ----------------------------------------------------------
-- 3. BASE DE DATOS: items_db
-- Entidad: Item (tabla 'items')
-- Nota: 'user_id' hace referencia a los usuarios creados arriba
-- ----------------------------------------------------------
USE items_db;

INSERT INTO items (id, name, quantity, price, purchased, user_id, created_at) VALUES
-- Items del Usuario 1 (Carlos)
(1, 'Leche entera 1L', 3, 1.25, false, 1, NOW()),
(2, 'Plátanos (kg)', 2, 1.80, true, 1, NOW()),
(3, 'Pechuga de pollo 1kg', 1, 6.50, false, 1, NOW()),
(4, 'Detergente líquido', 1, 7.99, false, 1, NOW()),

-- Items del Usuario 2 (Maria)
(5, 'Pan de molde integral', 2, 2.10, true, 2, NOW()),
(6, 'Docena de huevos', 1, 3.20, true, 2, NOW()),
(7, 'Pack agua mineral 6x1.5L', 2, 4.50, false, 2, NOW()),
(8, 'Café molido 250g', 1, 3.85, false, 2, NOW()),

-- Items del Usuario 3 (Juan)
(9, 'Manzanas Royal Gala (kg)', 2, 2.30, false, 3, NOW()),
(10, 'Queso Gouda 200g', 1, 2.95, true, 3, NOW());
