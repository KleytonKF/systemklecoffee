const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/clientes - Listar clientes
router.get('/', async (req, res) => {
    try {
        const [clientes] = await db.query(`
            SELECT c.*, 
                   COUNT(v.id) as total_compras,
                   COALESCE(SUM(v.valor_total), 0) as valor_total_compras
            FROM clientes c
            LEFT JOIN vendas v ON c.id = v.cliente_id
            WHERE c.status = 'Ativo'
            GROUP BY c.id
            ORDER BY c.nome ASC
        `);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clientes/:id - Buscar cliente específico
router.get('/:id', async (req, res) => {
    try {
        const [cliente] = await db.query(
            'SELECT * FROM clientes WHERE id = ?',
            [req.params.id]
        );
        
        if (cliente.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        
        // Buscar histórico de compras do cliente
        const [compras] = await db.query(`
            SELECT v.*, fp.nome as forma_pagamento
            FROM vendas v
            LEFT JOIN formas_pagamento fp ON v.forma_pagamento_id = fp.id
            WHERE v.cliente_id = ?
            ORDER BY v.data_venda DESC
            LIMIT 10
        `, [req.params.id]);
        
        res.json({
            ...cliente[0],
            historico_compras: compras
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/clientes - Criar novo cliente
router.post('/', async (req, res) => {
    const { nome, email, telefone, cpf_cnpj, tipo, endereco, cidade, estado, cep, observacoes } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO clientes 
            (nome, email, telefone, cpf_cnpj, tipo, endereco, cidade, estado, cep, observacoes, data_cadastro) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [nome, email, telefone, cpf_cnpj, tipo, endereco, cidade, estado, cep, observacoes]
        );
        
        // Registrar atividade
        await db.query(
            'INSERT INTO atividades_recentes (tipo, descricao) VALUES (?, ?)',
            ['Cliente', `Novo cliente cadastrado: ${nome}`]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Cliente cadastrado com sucesso!' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
    const { nome, email, telefone, cpf_cnpj, tipo, endereco, cidade, estado, cep, observacoes, status } = req.body;
    
    try {
        const [result] = await db.query(
            `UPDATE clientes 
            SET nome = ?, email = ?, telefone = ?, cpf_cnpj = ?, tipo = ?,
                endereco = ?, cidade = ?, estado = ?, cep = ?, observacoes = ?, status = ?
            WHERE id = ?`,
            [nome, email, telefone, cpf_cnpj, tipo, endereco, cidade, estado, cep, observacoes, status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }
        
        res.json({ message: 'Cliente atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;