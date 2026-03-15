const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/maquinas - Listar todas as máquinas
router.get('/', async (req, res) => {
    try {
        const [maquinas] = await db.query(`
            SELECT * FROM maquinas 
            ORDER BY 
                CASE status
                    WHEN 'Ativa' THEN 1
                    WHEN 'Manutenção' THEN 2
                    WHEN 'Inativa' THEN 3
                    WHEN 'Quebrada' THEN 4
                    ELSE 5
                END,
                nome ASC
        `);
        res.json(maquinas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/maquinas/:id - Buscar máquina específica
router.get('/:id', async (req, res) => {
    try {
        const [maquina] = await db.query(
            'SELECT * FROM maquinas WHERE id = ?',
            [req.params.id]
        );
        
        if (maquina.length === 0) {
            return res.status(404).json({ error: 'Máquina não encontrada' });
        }
        
        res.json(maquina[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/maquinas - Criar nova máquina
router.post('/', async (req, res) => {
    const { nome, modelo, numero_serie, localizacao, status, data_compra, observacoes } = req.body;
    
    try {
        const [result] = await db.query(
            `INSERT INTO maquinas 
            (nome, modelo, numero_serie, localizacao, status, data_compra, observacoes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, modelo, numero_serie, localizacao, status, data_compra, observacoes]
        );
        
        // Registrar atividade
        await db.query(
            'INSERT INTO atividades_recentes (tipo, descricao) VALUES (?, ?)',
            ['Máquina', `Nova máquina cadastrada: ${nome}`]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Máquina cadastrada com sucesso!' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/maquinas/:id - Atualizar máquina
router.put('/:id', async (req, res) => {
    const { nome, modelo, numero_serie, localizacao, status, data_compra, ultima_manutencao, proxima_manutencao, observacoes } = req.body;
    
    try {
        const [result] = await db.query(
            `UPDATE maquinas 
            SET nome = ?, modelo = ?, numero_serie = ?, localizacao = ?, 
                status = ?, data_compra = ?, ultima_manutencao = ?,
                proxima_manutencao = ?, observacoes = ?
            WHERE id = ?`,
            [nome, modelo, numero_serie, localizacao, status, data_compra, 
             ultima_manutencao, proxima_manutencao, observacoes, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Máquina não encontrada' });
        }
        
        res.json({ message: 'Máquina atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/maquinas/:id - Remover máquina
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM maquinas WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Máquina não encontrada' });
        }
        
        res.json({ message: 'Máquina removida com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;