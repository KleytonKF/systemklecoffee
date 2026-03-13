require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDatabase() {
  pool = mysql.createPool(dbConfig);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS maquinas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      modelo VARCHAR(120) NOT NULL,
      marca VARCHAR(120) NOT NULL,
      status_maquina ENUM('Disponível', 'Em uso', 'Manutenção') NOT NULL DEFAULT 'Disponível',
      localizacao VARCHAR(150) DEFAULT NULL,
      patrimonio VARCHAR(80) DEFAULT NULL,
      observacoes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'Banco conectado com sucesso.' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao conectar no banco.', error: error.message });
  }
});

app.get('/api/dashboard', async (_req, res) => {
  try {
    const [[{ totalMaquinas }]] = await pool.query('SELECT COUNT(*) AS totalMaquinas FROM maquinas');
    const [[{ disponiveis }]] = await pool.query("SELECT COUNT(*) AS disponiveis FROM maquinas WHERE status_maquina = 'Disponível'");
    const [[{ emUso }]] = await pool.query("SELECT COUNT(*) AS emUso FROM maquinas WHERE status_maquina = 'Em uso'");
    const [[{ manutencao }]] = await pool.query("SELECT COUNT(*) AS manutencao FROM maquinas WHERE status_maquina = 'Manutenção'");
    const [ultimas] = await pool.query('SELECT * FROM maquinas ORDER BY created_at DESC LIMIT 5');

    res.json({
      totalMaquinas,
      disponiveis,
      emUso,
      manutencao,
      ultimas
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados do dashboard.', error: error.message });
  }
});

app.get('/api/maquinas', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM maquinas ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar máquinas.', error: error.message });
  }
});

app.post('/api/maquinas', async (req, res) => {
  try {
    const { nome, modelo, marca, status_maquina, localizacao, patrimonio, observacoes } = req.body;

    if (!nome || !modelo || !marca) {
      return res.status(400).json({ message: 'Nome, modelo e marca são obrigatórios.' });
    }

    const [result] = await pool.query(
      `INSERT INTO maquinas (nome, modelo, marca, status_maquina, localizacao, patrimonio, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        modelo,
        marca,
        status_maquina || 'Disponível',
        localizacao || null,
        patrimonio || null,
        observacoes || null
      ]
    );

    const [[novaMaquina]] = await pool.query('SELECT * FROM maquinas WHERE id = ?', [result.insertId]);
    res.status(201).json(novaMaquina);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao cadastrar máquina.', error: error.message });
  }
});

app.delete('/api/maquinas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM maquinas WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Máquina não encontrada.' });
    }

    res.json({ message: 'Máquina removida com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover máquina.', error: error.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao iniciar o sistema:', error.message);
    process.exit(1);
  });
