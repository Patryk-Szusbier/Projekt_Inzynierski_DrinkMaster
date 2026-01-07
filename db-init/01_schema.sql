-- ========================
--  USERS
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(10) CHECK (role IN ('ADMIN','USER')) DEFAULT 'USER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================
--  ALCOHOLS
-- ========================
CREATE TABLE IF NOT EXISTS alcohols (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  abv DECIMAL(4,1),
  available BOOLEAN DEFAULT TRUE,
  volume_ml INTEGER
);

-- ========================
--  MIXERS
-- ========================
CREATE TABLE IF NOT EXISTS mixers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('soda','juice','syrup','other')) DEFAULT 'other',
  available BOOLEAN DEFAULT TRUE,
  volume_ml INTEGER
);

-- ========================
--  DRINKS
-- ========================
CREATE TABLE IF NOT EXISTS drinks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  image_url TEXT
);

-- ========================
--  DRINK INGREDIENTS
-- ========================
CREATE TABLE IF NOT EXISTS drink_ingredients (
  id SERIAL PRIMARY KEY,
  drink_id INTEGER REFERENCES drinks(id) ON DELETE CASCADE,
  ingredient_type VARCHAR(10) CHECK (ingredient_type IN ('alcohol','mixer')) NOT NULL,
  ingredient_id INTEGER NOT NULL,
  amount_ml INTEGER NOT NULL,
  order_index INTEGER,
  note TEXT
);

-- ========================
--  FAVORITE DRINKS
-- ========================
CREATE TABLE IF NOT EXISTS favorite_drinks (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  drink_id INTEGER REFERENCES drinks(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, drink_id)
);

-- ========================
--  MACHINE SLOTS (ALCOHOL/SYRUP)
-- ========================
CREATE TABLE IF NOT EXISTS machine_slots (
  id SERIAL PRIMARY KEY,
  slot_number INTEGER UNIQUE NOT NULL,
  ingredient_type VARCHAR(10) CHECK (ingredient_type IN ('alcohol','mixer')) NOT NULL,
  ingredient_id INTEGER NOT NULL,
  volume_ml INTEGER,
  active BOOLEAN DEFAULT TRUE,
  note TEXT
);

-- ========================
--  MACHINE FILLERS (MIXERS)
-- ========================
CREATE TABLE IF NOT EXISTS machine_fillers (
  id SERIAL PRIMARY KEY,
  slot_number INTEGER UNIQUE NOT NULL,
  mixer_id INTEGER REFERENCES mixers(id) ON DELETE CASCADE,
  volume_ml INTEGER,
  active BOOLEAN DEFAULT TRUE,
  note TEXT
);
