
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY,
  tempo_sessao INT NOT NULL DEFAULT 30,
  max_tentativas INT NOT NULL DEFAULT 3,
  exigir_senha_forte TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  email VARCHAR(150) NOT NULL,
  nivel VARCHAR(30) NOT NULL DEFAULT 'operador',
  status VARCHAR(20) NOT NULL DEFAULT 'ativo'
);

CREATE TABLE IF NOT EXISTS machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  sn VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  imagem TEXT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  imagem TEXT NULL,
  valor_compra DECIMAL(10,2) NOT NULL,
  valor_venda DECIMAL(10,2) NOT NULL,
  margem DECIMAL(10,2) NOT NULL,
  quantidade INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(30) NOT NULL,
  razao_social VARCHAR(180) NOT NULL,
  cnpj VARCHAR(40) NOT NULL,
  nome_completo VARCHAR(180) NOT NULL,
  cpf VARCHAR(40) NOT NULL,
  contato VARCHAR(80) NOT NULL,
  email VARCHAR(150) NOT NULL,
  logradouro VARCHAR(180) NOT NULL,
  numero VARCHAR(40) NOT NULL,
  complemento VARCHAR(180) NULL,
  bairro VARCHAR(120) NOT NULL,
  cidade VARCHAR(120) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  cep VARCHAR(20) NOT NULL,
  valor_locacao DECIMAL(10,2) NULL
);

CREATE TABLE IF NOT EXISTS client_machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  machine_id INT NOT NULL,
  UNIQUE KEY uniq_client_machine (client_id, machine_id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nome_evento VARCHAR(180) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  logradouro VARCHAR(180) NOT NULL,
  numero VARCHAR(40) NOT NULL,
  bairro VARCHAR(120) NULL,
  cidade VARCHAR(120) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  cep VARCHAR(20) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'proximo',
  observacoes TEXT NULL,
  FOREIGN KEY (cliente_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_machines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  machine_id INT NOT NULL,
  UNIQUE KEY uniq_event_machine (event_id, machine_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_supplies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(30) NOT NULL,
  cliente_id INT NULL,
  evento_id INT NULL,
  produto_id INT NULL,
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pago',
  FOREIGN KEY (cliente_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY (evento_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (produto_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO app_settings (id, tempo_sessao, max_tentativas, exigir_senha_forte)
VALUES (1, 30, 3, 1)
ON DUPLICATE KEY UPDATE
tempo_sessao=VALUES(tempo_sessao),
max_tentativas=VALUES(max_tentativas),
exigir_senha_forte=VALUES(exigir_senha_forte);

INSERT INTO users (id, nome, usuario, senha, email, nivel, status)
VALUES
(1, 'Kléber', 'kleber', '123456', 'kleber@klecoffee.com', 'admin', 'ativo'),
(2, 'Maria Silva', 'maria', '123456', 'maria@klecoffee.com', 'gerente', 'ativo')
ON DUPLICATE KEY UPDATE nome=VALUES(nome), email=VALUES(email), nivel=VALUES(nivel), status=VALUES(status);

INSERT INTO machines (id, marca, modelo, sn, valor, imagem)
VALUES
(1, 'Nespresso', 'Inissia', 'SN12345', 189.90, ''),
(2, 'Jura', 'E8', 'J87654Z', 549.90, 'https://images.unsplash.com/photo-1525548002014-e18135c82ff3?w=200&h=150&fit=crop'),
(3, 'Siemens', 'EQ.6', 'SIEM-2026', 425.00, '')
ON DUPLICATE KEY UPDATE marca=VALUES(marca), modelo=VALUES(modelo), valor=VALUES(valor), imagem=VALUES(imagem);

INSERT INTO products (id, nome, imagem, valor_compra, valor_venda, margem, quantidade)
VALUES
(1, 'Cápsula Intenso', '', 0.50, 1.20, 140.00, 150),
(2, 'Cápsula Suave', '', 0.50, 1.20, 140.00, 200),
(3, 'Café em Grão', '', 18.00, 35.00, 94.44, 25),
(4, 'Açúcar 1kg', '', 3.50, 7.00, 100.00, 50)
ON DUPLICATE KEY UPDATE nome=VALUES(nome), quantidade=VALUES(quantidade);

INSERT INTO clients (id, tipo, razao_social, cnpj, nome_completo, cpf, contato, email, logradouro, numero, complemento, bairro, cidade, uf, cep, valor_locacao)
VALUES
(1, 'fixo', 'Café com Prosa Ltda', '12.345.678/0001-90', 'João Silva', '123.456.789-00', '(11) 99999-8888', 'contato@cafeprosa.com', 'Rua das Flores', '123', '', 'Centro', 'São Paulo', 'SP', '01234-567', 347.00),
(2, 'evento', 'Festival de Inverno', '98.765.432/0001-10', 'Maria Oliveira', '987.654.321-00', '(11) 97777-6666', 'contato@festival.com', 'Av. Paulista', '1000', '', 'Bela Vista', 'São Paulo', 'SP', '01310-100', NULL)
ON DUPLICATE KEY UPDATE razao_social=VALUES(razao_social), contato=VALUES(contato), email=VALUES(email);

INSERT IGNORE INTO client_machines (client_id, machine_id) VALUES (1, 2);

INSERT INTO events (id, cliente_id, nome_evento, data_inicio, data_fim, logradouro, numero, bairro, cidade, uf, cep, status, observacoes)
VALUES
(1, 1, 'Feira do Café', '2026-04-15', '2026-04-18', 'Av. das Nações', '5000', 'Morumbi', 'São Paulo', 'SP', '04795-100', 'proximo', '')
ON DUPLICATE KEY UPDATE nome_evento=VALUES(nome_evento), status=VALUES(status);

INSERT IGNORE INTO event_machines (event_id, machine_id) VALUES (1, 1), (1, 2);
INSERT IGNORE INTO event_supplies (event_id, product_id, quantity) VALUES (1, 1, 50), (1, 2, 30);

INSERT INTO payments (id, tipo, cliente_id, evento_id, produto_id, descricao, valor, data, status)
VALUES
(1, 'cliente', 1, NULL, NULL, 'Mensalidade - Mar/2026', 347.00, '2026-03-10', 'pago'),
(2, 'evento', NULL, 1, NULL, 'Feira do Café - Parcial', 1500.00, '2026-03-05', 'parcial'),
(3, 'venda', NULL, NULL, 1, 'Cápsula Intenso - 10 un', 12.00, '2026-03-13', 'pago')
ON DUPLICATE KEY UPDATE descricao=VALUES(descricao), valor=VALUES(valor), status=VALUES(status);
