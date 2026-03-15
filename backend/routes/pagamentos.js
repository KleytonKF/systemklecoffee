const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/pagamentos/vendas - Listar vendas
router.get('/vendas', async (req, res) => {
    try {
        const [vendas] = await db.query(`
            SELECT v.*, 
                   c.nome as nome_cliente,
                   fp.nome as forma_pagamento
            FROM vendas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN formas_pagamento fp ON v.forma_pagamento_id = fp.id
            ORDER BY v.data_venda DESC
        `);
        res.json(vendas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pagamentos/forma-pagamento - Listar formas de pagamento
router.get('/forma-pagamento', async (req, res) => {
    try {
        const [formas] = await db.query('SELECT * FROM formas_pagamento');
        res.json(formas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/pagamentos/vendas - Registrar nova venda
router.post('/vendas', async (req, res) => {
    const { cliente_id, itens, forma_pagamento_id, observacoes } = req.body;
    
    try {
        // Calcular total
        let total = 0;
        for (const item of itens) {
            total += item.quantidade * item.preco_unitario;
        }
        
        // Iniciar transação
        await db.query('START TRANSACTION');
        
        // Inserir venda
        const [venda] = await db.query(
            `INSERT INTO vendas 
            (cliente_id, valor_total, forma_pagamento_id, status, observacoes) 
            VALUES (?, ?, ?, 'Pendente', ?)`,
            [cliente_id, total, forma_pagamento_id, observacoes]
        );
        
        // Inserir itens da venda
        for (const item of itens) {
            await db.query(
                `INSERT INTO itens_venda 
                (venda_id, produto_id, quantidade, preco_unitario, subtotal) 
                VALUES (?, ?, ?, ?, ?)`,
                [venda.insertId, item.produto_id, item.quantidade, 
                 item.preco_unitario, item.quantidade * item.preco_unitario]
            );
            
            // Atualizar estoque
            await db.query(
                'UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?',
                [item.quantidade, item.produto_id]
            );
        }
        
        // Commit da transação
        await db.query('COMMIT');
        
        // Registrar atividade
        await db.query(
            'INSERT INTO atividades_recentes (tipo, descricao) VALUES (?, ?)',
            ['Venda', `Nova venda registrada - R$ ${total.toFixed(2)}`]
        );
        
        res.status(201).json({ 
            id: venda.insertId, 
            message: 'Venda registrada com sucesso!' 
        });
    } catch (error) {
        // Rollback em caso de erro
        await db.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/pagamentos/vendas/:id/status - Atualizar status da venda
router.put('/vendas/:id/status', async (req, res) => {
    const { status } = req.body;
    
    try {
        const [result] = await db.query(
            'UPDATE vendas SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }
        
        res.json({ message: 'Status da venda atualizado!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pagamentos/resumo-diario - Resumo de pagamentos do dia
router.get('/resumo-diario', async (req, res) => {
    try {
        const [resumo] = await db.query(`
            SELECT 
                fp.nome as forma_pagamento,
                COUNT(*) as quantidade,
                COALESCE(SUM(v.valor_total), 0) as total
            FROM vendas v
            JOIN formas_pagamento fp ON v.forma_pagamento_id = fp.id
            WHERE DATE(v.data_venda) = CURDATE()
            AND v.status = 'Pago'
            GROUP BY fp.nome
        `);
        
        const [totalDia] = await db.query(`
            SELECT COALESCE(SUM(valor_total), 0) as total
            FROM vendas
            WHERE DATE(data_venda) = CURDATE()
            AND status = 'Pago'
        `);
        
        res.json({
            formas: resumo,
            total_dia: totalDia[0].total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;