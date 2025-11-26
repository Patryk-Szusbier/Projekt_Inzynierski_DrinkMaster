-- -------------------------------
-- USERS
-- -------------------------------
INSERT INTO users (username, password_hash, email, role)
VALUES
('admin', 'hashedpassword1', 'admin@example.com', 'ADMIN'),
('john_doe', 'hashedpassword2', 'john@example.com', 'USER');

-- -------------------------------
-- ALCOHOLS
-- -------------------------------
INSERT INTO alcohols (name, abv, available, volume_ml)
VALUES
('Rum', 40.0, true, 1000),
('Whisky', 45.0, true, 500),
('Vodka', 37.5, true, 750);

-- -------------------------------
-- MIXERS
-- -------------------------------
INSERT INTO mixers (name, type, available, volume_ml)
VALUES
('Cola', 'soda', true, 2000),
('Sok jabłkowy', 'juice', true, 1500),
('Syrop malinowy', 'syrup', true, 1000),
('Woda gazowana', 'other', true, 3000);

-- -------------------------------
-- DRINKS
-- -------------------------------
INSERT INTO drinks (name, description, author_id, is_public, image_url)
VALUES
('Cuba Libre', 'Rum + Cola + Lime', 1, true, NULL),
('Whisky Sour', 'Whisky + Lemon + Sugar', 1, true, NULL);

-- -------------------------------
-- DRINK INGREDIENTS
-- -------------------------------
INSERT INTO drink_ingredients (drink_id, ingredient_type, ingredient_id, amount_ml, order_index, note)
VALUES
(1, 'alcohol', 1, 50, 1, 'Rum'),
(1, 'mixer', 1, 100, 2, 'Cola'),
(2, 'alcohol', 2, 50, 1, 'Whisky'),
(2, 'mixer', 2, 30, 2, 'Sok jabłkowy');

-- -------------------------------
-- FAVORITE DRINKS
-- -------------------------------
INSERT INTO favorite_drinks (user_id, drink_id)
VALUES
(2, 1);

-- -------------------------------
-- MACHINE SLOTS (ALCOHOLS/SYROP)
-- -------------------------------
INSERT INTO machine_slots (slot_number, ingredient_type, ingredient_id, volume_ml, active, note)
VALUES
  (1, 'alcohol', 1, 1000, true, 'Rum slot'),
  (2, 'alcohol', 2, 500, true, 'Whisky slot'),
  (3, 'mixer', 3, 1000, true, 'Syrop malinowy slot'),
  (4, 'mixer', 0, 0, false, 'Empty slot'),
  (5, 'mixer', 0, 0, false, 'Empty slot'),
  (6, 'mixer', 0, 0, false, 'Empty slot')
ON CONFLICT (slot_number) DO NOTHING;


-- -------------------------------
-- MACHINE FILLERS (NAPOJE)
-- -------------------------------
INSERT INTO machine_fillers (slot_number, mixer_id, volume_ml, active, note)
VALUES
(7, 1, 2000, true, 'Cola slot'),
(8, 2, 1500, true, 'Sok jabłkowy slot'),
(9, 3, 1000, true, 'Syrop malinowy slot'),
(10, 4, 3000, true, 'Woda gazowana slot')
ON CONFLICT (slot_number) DO NOTHING;

