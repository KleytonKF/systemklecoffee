-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS klecoffee_db;
USE klecoffee_db;

-- ============================================
-- TABELA DE MÁQUINAS
-- ============================================
CREATE TABLE maquinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    modelo VARCHAR(100),
    numero_serie VARCHAR(50) UNIQUE,
    localizacao VARCHAR(200),
    status ENUM('Ativa', 'Inativa', 'Manutenção', 'Quebrada') DEFAULT 'Ativa',
    data_compra DATE,
    ultima_manutencao DATE,
    proxima_manutencao DATE,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA DE CLIENTES
-- ============================================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefone VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    tipo ENUM('Pessoa Física', 'Pessoa Jurídica') DEFAULT 'Pessoa Física',
    endereco TEXT,
    cidade VARCHAR(100),
    estado CHAR(2),
    cep VARCHAR(10),
    data_cadastro DATE,
    observacoes TEXT,
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA DE EVENTOS
-- ============================================
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo ENUM('Manutenção', 'Promoção', 'Workshop', 'Degustação', 'Outro') DEFAULT 'Outro',
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME,
    local VARCHAR(200),
    cliente_id INT,
    maquina_id INT,
    observacoes TEXT,
    status ENUM('Agendado', 'Em Andamento', 'Concluído', 'Cancelado') DEFAULT 'Agendado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (maquina_id) REFERENCES maquinas(id) ON DELETE SET NULL
);

-- ============================================
-- TABELA DE ESTOQUE
-- ============================================
CREATE TABLE categorias_produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    codigo_barras VARCHAR(50),
    categoria_id INT,
    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2),
    quantidade INT DEFAULT 0,
    quantidade_minima INT DEFAULT 5,
    unidade VARCHAR(20) DEFAULT 'UN',
    fornecedor VARCHAR(200),
    validade DATE,
    localizacao VARCHAR(100),
    status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_produtos(id) ON DELETE SET NULL
);

-- ============================================
-- TABELA DE PAGAMENTOS
-- ============================================
CREATE TABLE formas_pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    taxa DECIMAL(5,2) DEFAULT 0
);

CREATE TABLE vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2),
    forma_pagamento_id INT,
    status ENUM('Pendente', 'Pago', 'Cancelado', 'Estornado') DEFAULT 'Pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (forma_pagamento_id) REFERENCES formas_pagamento(id)
);

CREATE TABLE itens_venda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    produto_id INT,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
);

-- ============================================
-- TABELA PARA DASHBOARD (LOG DE ATIVIDADES)
-- ============================================
CREATE TABLE atividades_recentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    usuario VARCHAR(100),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERÇÃO DE DADOS INICIAIS
-- ============================================

-- Inserir formas de pagamento
INSERT INTO formas_pagamento (nome, descricao) VALUES
('Dinheiro', 'Pagamento em espécie'),
('Cartão de Crédito', 'Bandeiras: Visa, Mastercard, Elo'),
('Cartão de Débito', 'Bandeiras: Visa, Mastercard, Elo'),
('PIX', 'Pagamento instantâneo'),
('Fiado', 'Pagamento posterior');

-- Inserir categorias de produtos
INSERT INTO categorias_produtos (nome, descricao) VALUES
('Cafés', 'Grãos selecionados e moídos'),
('Máquinas', 'Equipamentos para café'),
('Acessórios', 'Itens complementares'),
('Descartáveis', 'Copos, colheres, guardanapos'),
('Alimentos', 'Pães de queijo, salgados');

-- Inserir produtos de exemplo
INSERT INTO produtos (nome, descricao, categoria_id, preco_venda, quantidade, quantidade_minima) VALUES
('Café Especial Bourbon', 'Grãos selecionados 250g', 1, 35.90, 20, 5),
('Café Tradicional', 'Pacote 500g', 1, 22.90, 35, 10),
('Máquina Expresso Automática', 'Máquina digital com moedor', 2, 1899.90, 5, 2),
('Prensa Francesa', '600ml em vidro', 3, 89.90, 15, 3),
('Copo Descartável 200ml', 'Pacote com 100 unidades', 4, 15.90, 10, 5),
('Pão de Queijo', 'Pacote 500g (congelado)', 5, 18.90, 25, 8);

-- Inserir máquinas de exemplo
INSERT INTO maquinas (nome, modelo, numero_serie, localizacao, status) VALUES
('Expresso Profissional', 'XPE-2000', 'XP2023001', 'Balcão Principal', 'Ativa'),
('Moedor de Grãos', 'GM-100', 'GM2023001', 'Área de Preparo', 'Ativa'),
('Cafeteira de Filtro', 'CF-50', 'CF2023001', 'Salão', 'Manutenção');

-- Inserir clientes de exemplo
INSERT INTO clientes (nome, email, telefone, cidade, estado) VALUES
('João Silva', 'joao@email.com', '(11) 99999-9999', 'São Paulo', 'SP'),
('Maria Santos', 'maria@email.com', '(11) 98888-8888', 'São Paulo', 'SP'),
('Café & Cia Ltda', 'contato@cafeecia.com', '(11) 3777-7777', 'São Paulo', 'SP');

-- Inserir eventos de exemplo
INSERT INTO eventos (titulo, descricao, tipo, data_inicio, data_fim, local) VALUES
('Manutenção Preventiva', 'Limpeza e calibração das máquinas', 'Manutenção', 
 DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 'Matriz'),
('Workshop de Barista', 'Aprenda a fazer o café perfeito', 'Workshop',
 DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 8 DAY), 'Salão de Eventos');

-- Inserir atividades recentes
INSERT INTO atividades_recentes (tipo, descricao) VALUES
('Venda', 'Venda realizada para João Silva - R$ 45,90'),
('Estoque', 'Produto "Café Especial" atualizado'),
('Cliente', 'Novo cliente cadastrado: Maria Santos'),
('Máquina', 'Máquina XPE-2000 passou por manutenção');