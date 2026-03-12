CREATE DATABASE IF NOT EXISTS klecoffee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE klecoffee;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  photo_url VARCHAR(255) NULL,
  serial_number VARCHAR(120) NOT NULL UNIQUE,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  model VARCHAR(120) NOT NULL,
  brand VARCHAR(120) NOT NULL,
  status ENUM('disponivel','em_uso','manutencao','inativa') NOT NULL DEFAULT 'disponivel',
  last_maintenance DATE NULL,
  next_maintenance DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  corporate_name VARCHAR(180) NOT NULL,
  cnpj VARCHAR(30) NULL,
  contact_name VARCHAR(120) NOT NULL,
  cpf VARCHAR(30) NULL,
  phone VARCHAR(40) NULL,
  email VARCHAR(150) NULL,
  address TEXT NULL,
  payment_day DATE NULL,
  monthly_fee DECIMAL(10,2) NULL,
  machine_id INT NULL,
  client_type ENUM('fixo','evento') NOT NULL DEFAULT 'fixo',
  status ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_clients_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  location VARCHAR(180) NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  guests_count INT NULL,
  estimated_value DECIMAL(10,2) NULL,
  machine_id INT NULL,
  supplies_notes TEXT NULL,
  status ENUM('orcamento','confirmado','finalizado','cancelado') NOT NULL DEFAULT 'orcamento',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  photo_url VARCHAR(255) NULL,
  name VARCHAR(160) NOT NULL,
  sku VARCHAR(80) NULL,
  category VARCHAR(100) NULL,
  purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_alert INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_type ENUM('cliente_fixo','evento','venda_produto') NOT NULL,
  reference_id INT NULL,
  customer_name VARCHAR(180) NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('pix','transferencia','cartao','dinheiro','boleto') NOT NULL DEFAULT 'pix',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_payment_items_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
