const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/eventos - Listar eventos
router.get('/', async (req, res) => {
    try {
        const [eventos] = await db.query(`
            SELECT e.*, 
                   c.nome as nome_cliente,
                   m.nome as nome_maquina
            FROM eventos e
            LEFT JOIN clientes c ON e.cliente_id = c.id
            LEFT JOIN maquinas m ON e.maquina_id = m.id
            ORDER BY e.data_inicio ASC
        `);
        res.json(eventos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/eventos/proximos - Próximos eventos
router.get('/proximos', async (req, res) => {
    try {
        const [eventos] = await db.query(`
            SELECT e.*, 
                   c.nome as nome_cliente,
                   m.nome as nome_maquina
            FROM eventos e
            LEFT JOIN clientes c ON e.cliente_id = c.id
            LEFT JOIN maquinas m ON e.maquina_id = m.id
            WHERE e.data_inicio >= NOW() 
            AND e.status != 'Cancelado'
            ORDER BY e.data_inicio ASC
            LIMIT 10
        `);
        res.json(eventos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/eventos - Criar novo evento
router.post('/', async (req, res) => {
    const { titulo, descricao, tipo, data_inicio, data_fim, local, cliente_id, maquina_id, observacoes } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO eventos 
            (titulo, descricao, tipo, data_inicio, data_fim, local, cliente_id, maquina_id, observacoes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titulo, descricao, tipo, data_inicio, data_fim, local, cliente_id, maquina_id, observacoes]
        );
        
        // Registrar atividade
        await db.query(
            'INSERT INTO atividades_recentes (tipo, descricao) VALUES (?, ?)',
            ['Evento', `Novo evento agendado: ${titulo}`]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Evento criado com sucesso!' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/eventos/:id/status - Atualizar status do evento
router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    
    try {
        const [result] = await db.query(
            'UPDATE eventos SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Evento não encontrado' });
        }
        
        res.json({ message: 'Status do evento atualizado!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;