const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/dashboard/stats - Estatísticas gerais
router.get('/stats', async (req, res) => {
    try {
        // Total de máquinas
        const [maquinas] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Ativa' THEN 1 ELSE 0 END) as ativas,
                SUM(CASE WHEN status = 'Manutenção' THEN 1 ELSE 0 END) as manutencao
            FROM maquinas
        `);

        // Total de clientes
        const [clientes] = await db.query(`
            SELECT COUNT(*) as total FROM clientes WHERE status = 'Ativo'
        `);

        // Vendas do dia
        const [vendasHoje] = await db.query(`
            SELECT 
                COUNT(*) as total_vendas,
                COALESCE(SUM(valor_total), 0) as valor_total
            FROM vendas 
            WHERE DATE(data_venda) = CURDATE()
            AND status = 'Pago'
        `);

        // Produtos com estoque baixo
        const [estoqueBaixo] = await db.query(`
            SELECT COUNT(*) as total 
            FROM produtos 
            WHERE quantidade <= quantidade_minima 
            AND status = 'Ativo'
        `);

        // Eventos de hoje
        const [eventosHoje] = await db.query(`
            SELECT COUNT(*) as total 
            FROM eventos 
            WHERE DATE(data_inicio) = CURDATE()
            AND status != 'Cancelado'
        `);

        res.json({
            maquinas: maquinas[0],
            clientes: clientes[0],
            vendas_hoje: vendasHoje[0],
            estoque_baixo: estoqueBaixo[0],
            eventos_hoje: eventosHoje[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/atividades-recentes
router.get('/atividades-recentes', async (req, res) => {
    try {
        const [atividades] = await db.query(`
            SELECT * FROM atividades_recentes 
            ORDER BY data_hora DESC 
            LIMIT 10
        `);
        res.json(atividades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dashboard/vendas-ultimos-7-dias
router.get('/vendas-semanais', async (req, res) => {
    try {
        const [vendas] = await db.query(`
            SELECT 
                DATE(data_venda) as data,
                COUNT(*) as quantidade,
                SUM(valor_total) as total
            FROM vendas 
            WHERE data_venda >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND status = 'Pago'
            GROUP BY DATE(data_venda)
            ORDER BY data DESC
        `);
        res.json(vendas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;