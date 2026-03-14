CREATE DATABASE IF NOT EXISTS klecoffeesystem_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE klecoffeesystem_db;

CREATE TABLE IF NOT EXISTS configuracoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tempo_sessao INT NOT NULL DEFAULT 30,
  max_tentativas INT NOT NULL DEFAULT 3,
  exigir_senha_forte TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO configuracoes (id, tempo_sessao, max_tentativas, exigir_senha_forte)
VALUES (1, 30, 3, 1)
ON DUPLICATE KEY UPDATE
  tempo_sessao = VALUES(tempo_sessao),
  max_tentativas = VALUES(max_tentativas),
  exigir_senha_forte = VALUES(exigir_senha_forte);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  usuario VARCHAR(80) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  email VARCHAR(160) NOT NULL,
  nivel ENUM('admin','gerente','operador') NOT NULL DEFAULT 'operador',
  status ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO usuarios (id, nome, usuario, senha, email, nivel, status)
VALUES
  (1, 'Kléber', 'kleber', '123456', 'kleber@klecoffee.com', 'admin', 'ativo'),
  (2, 'Maria Silva', 'maria', '123456', 'maria@klecoffee.com', 'gerente', 'ativo')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

CREATE TABLE IF NOT EXISTS maquinas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marca VARCHAR(120) NOT NULL,
  modelo VARCHAR(120) NOT NULL,
  sn VARCHAR(120) NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  imagem TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO maquinas (id, marca, modelo, sn, valor, imagem)
VALUES
  (1, 'Nespresso', 'Inissia', 'SN12345', 189.90, ''),
  (2, 'Jura', 'E8', 'J87654Z', 549.90, 'https://images.unsplash.com/photo-1525548002014-e18135c82ff3?w=200&h=150&fit=crop'),
  (3, 'Siemens', 'EQ.6', 'SIEM-2026', 425.00, '')
ON DUPLICATE KEY UPDATE marca = VALUES(marca);

CREATE TABLE IF NOT EXISTS produtos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(160) NOT NULL,
  imagem TEXT NULL,
  valor_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
  valor_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
  margem DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO produtos (id, nome, imagem, valor_compra, valor_venda, margem, quantidade)
VALUES
  (1, 'Cápsula Intenso', '', 0.50, 1.20, 140.00, 150),
  (2, 'Cápsula Suave', '', 0.50, 1.20, 140.00, 200),
  (3, 'Café em Grão', '', 18.00, 35.00, 94.44, 25),
  (4, 'Açúcar 1kg', '', 3.50, 7.00, 100.00, 50)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

CREATE TABLE IF NOT EXISTS clientes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('fixo','evento') NOT NULL DEFAULT 'fixo',
  razao_social VARCHAR(200) NOT NULL,
  cnpj VARCHAR(40) NOT NULL,
  nome_completo VARCHAR(160) NOT NULL,
  cpf VARCHAR(40) NOT NULL,
  contato VARCHAR(60) NOT NULL,
  email VARCHAR(160) NOT NULL,
  logradouro VARCHAR(200) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(120) NULL,
  bairro VARCHAR(120) NOT NULL,
  cidade VARCHAR(120) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  cep VARCHAR(20) NOT NULL,
  maquinas_json JSON NULL,
  valor_locacao DECIMAL(10,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO clientes (id, tipo, razao_social, cnpj, nome_completo, cpf, contato, email, logradouro, numero, complemento, bairro, cidade, uf, cep, maquinas_json, valor_locacao)
VALUES
  (1, 'fixo', 'Café com Prosa Ltda', '12.345.678/0001-90', 'João Silva', '123.456.789-00', '(11) 99999-8888', 'contato@cafeprosa.com', 'Rua das Flores', '123', '', 'Centro', 'São Paulo', 'SP', '01234-567', JSON_ARRAY(2), 347.00),
  (2, 'evento', 'Festival de Inverno', '98.765.432/0001-10', 'Maria Oliveira', '987.654.321-00', '(11) 97777-6666', 'contato@festival.com', 'Av. Paulista', '1000', '', 'Bela Vista', 'São Paulo', 'SP', '01310-100', JSON_ARRAY(), NULL)
ON DUPLICATE KEY UPDATE razao_social = VALUES(razao_social);

CREATE TABLE IF NOT EXISTS eventos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  nome_evento VARCHAR(200) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  logradouro VARCHAR(200) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  bairro VARCHAR(120) NULL,
  cidade VARCHAR(120) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  cep VARCHAR(20) NULL,
  maquinas_json JSON NULL,
  insumos_json JSON NULL,
  status ENUM('proximo','andamento','concluido') NOT NULL DEFAULT 'proximo',
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

INSERT INTO eventos (id, cliente_id, nome_evento, data_inicio, data_fim, logradouro, numero, bairro, cidade, uf, cep, maquinas_json, insumos_json, status, observacoes)
VALUES
  (1, 1, 'Feira do Café', '2026-04-15', '2026-04-18', 'Av. das Nações', '5000', 'Morumbi', 'São Paulo', 'SP', '04795-100', JSON_ARRAY(1,2), JSON_ARRAY(JSON_OBJECT('id', 1, 'quantidade', 50), JSON_OBJECT('id', 2, 'quantidade', 30)), 'proximo', NULL)
ON DUPLICATE KEY UPDATE nome_evento = VALUES(nome_evento);

CREATE TABLE IF NOT EXISTS pagamentos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo ENUM('cliente','evento','venda') NOT NULL,
  cliente_id INT NULL,
  evento_id INT NULL,
  produto_id INT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL,
  status ENUM('pago','parcial','pendente') NOT NULL DEFAULT 'pago',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pagamentos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_pagamentos_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL,
  CONSTRAINT fk_pagamentos_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
);

INSERT INTO pagamentos (id, tipo, cliente_id, evento_id, produto_id, descricao, valor, data, status)
VALUES
  (1, 'cliente', 1, NULL, NULL, 'Mensalidade - Mar/2026', 347.00, '2026-03-10', 'pago'),
  (2, 'evento', NULL, 1, NULL, 'Feira do Café - Parcial', 1500.00, '2026-03-05', 'parcial'),
  (3, 'venda', NULL, NULL, 1, 'Cápsula Intenso - 10 un', 12.00, '2026-03-13', 'pago')
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao);
