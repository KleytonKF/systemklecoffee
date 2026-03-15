const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/estoque/produtos - Listar produtos
router.get('/produtos', async (req, res) => {
    try {
        const [produtos] = await db.query(`
            SELECT p.*, c.nome as nome_categoria,
                   CASE 
                       WHEN p.quantidade <= p.quantidade_minima THEN 'Baixo'
                       WHEN p.quantidade <= p.quantidade_minima * 2 THEN 'Médio'
                       ELSE 'Bom'
                   END as status_estoque
            FROM produtos p
            LEFT JOIN categorias_produtos c ON p.categoria_id = c.id
            WHERE p.status = 'Ativo'
            ORDER BY 
                CASE 
                    WHEN p.quantidade <= p.quantidade_minima THEN 1
                    ELSE 2
                END,
                p.nome ASC
        `);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/estoque/categorias - Listar categorias
router.get('/categorias', async (req, res) => {
    try {
        const [categorias] = await db.query('SELECT * FROM categorias_produtos ORDER BY nome');
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/estoque/baixo - Produtos com estoque baixo
router.get('/baixo', async (req, res) => {
    try {
        const [produtos] = await db.query(`
            SELECT * FROM produtos 
            WHERE quantidade <= quantidade_minima 
            AND status = 'Ativo'
            ORDER BY quantidade ASC
        `);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/estoque/produtos - Adicionar produto
router.post('/produtos', async (req, res) => {
    const { nome, descricao, codigo_barras, categoria_id, preco_custo, preco_venda, quantidade, quantidade_minima, unidade, fornecedor, validade, localizacao } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO produtos 
            (nome, descricao, codigo_barras, categoria_id, preco_custo, preco_venda, 
             quantidade, quantidade_minima, unidade, fornecedor, validade, localizacao) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nome, descricao, codigo_barras, categoria_id, preco_custo, preco_venda, 
             quantidade, quantidade_minima, unidade, fornecedor, validade, localizacao]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Produto cadastrado com sucesso!' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/estoque/produtos/:id/quantidade - Atualizar quantidade
router.put('/produtos/:id/quantidade', async (req, res) => {
    const { quantidade, operacao } = req.body; // operacao: 'adicionar' ou 'remover'
    
    try {
        let query;
        if (operacao === 'adicionar') {
            query = 'UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?';
        } else {
            query = 'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?';
        }
        
        const [result] = await db.query(query, [quantidade, req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        res.json({ message: 'Estoque atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;