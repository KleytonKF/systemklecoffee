require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'klecoffee_session_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 12
    }
  })
);
app.use(express.static(path.join(__dirname, 'public')));

const env = {
  host:
    process.env.DB_HOST ||
    process.env.MYSQL_HOST ||
    process.env.MYSQLHOST ||
    process.env.HOSTNAME_DB,
  port: Number(
    process.env.DB_PORT ||
      process.env.MYSQL_PORT ||
      process.env.MYSQLPORT ||
      3306
  ),
  user:
    process.env.DB_USER ||
    process.env.MYSQL_USER ||
    process.env.MYSQLUSER,
  password:
    process.env.DB_PASSWORD ||
    process.env.MYSQL_PASSWORD ||
    process.env.MYSQLPASSWORD,
  database:
    process.env.DB_NAME ||
    process.env.MYSQL_DATABASE ||
    process.env.MYSQLDATABASE
};

function validateEnv() {
  const missing = [];
  if (!env.host) missing.push('DB_HOST');
  if (!env.user) missing.push('DB_USER');
  if (!env.password) missing.push('DB_PASSWORD');
  if (!env.database) missing.push('DB_NAME');

  if (missing.length) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(', ')}. ` +
        'Crie o arquivo .env na raiz do projeto com as credenciais do MySQL.'
    );
  }
}

const dbConfig = {
  host: env.host,
  port: env.port,
  user: env.user,
  password: env.password,
  database: env.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

let pool;

async function ensureDefaultAdmin() {
  const [[{ totalUsuarios }]] = await pool.query('SELECT COUNT(*) AS totalUsuarios FROM usuarios');

  if (totalUsuarios > 0) return;

  const senhaHash = await bcrypt.hash('123456', 10);
  await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil)
     VALUES (?, ?, ?, ?)`,
    ['Administrador', 'admin@klecoffee.com', senhaHash, 'Administrador']
  );

  console.log('Usuário padrão criado: admin@klecoffee.com / 123456');
}

async function initDatabase() {
  validateEnv();

  console.log('Conectando ao MySQL com:');
  console.log({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database
  });

  pool = mysql.createPool(dbConfig);

  await pool.query('SELECT 1');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      perfil ENUM('Administrador', 'Operador') NOT NULL DEFAULT 'Operador',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

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

  await ensureDefaultAdmin();
}

function requireAuth(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ message: 'Sessão expirada ou usuário não autenticado.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.usuario || req.session.usuario.perfil !== 'Administrador') {
    return res.status(403).json({ message: 'Apenas administradores podem realizar esta ação.' });
  }
  next();
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'Banco conectado com sucesso.' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao conectar no banco.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'Informe e-mail e senha.' });
    }

    const [rows] = await pool.query(
      'SELECT id, nome, email, senha_hash, perfil FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );

    const usuario = rows[0];

    if (!usuario) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    };

    res.json({ usuario: req.session.usuario });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao realizar login.', error: error.message });
  }
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: 'Não foi possível encerrar a sessão.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logout realizado com sucesso.' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ message: 'Usuário não autenticado.' });
  }

  return res.json({ usuario: req.session.usuario });
});

app.get('/api/dashboard', requireAuth, async (_req, res) => {
  try {
    const [[{ totalMaquinas }]] = await pool.query('SELECT COUNT(*) AS totalMaquinas FROM maquinas');
    const [[{ disponiveis }]] = await pool.query("SELECT COUNT(*) AS disponiveis FROM maquinas WHERE status_maquina = 'Disponível'");
    const [[{ emUso }]] = await pool.query("SELECT COUNT(*) AS emUso FROM maquinas WHERE status_maquina = 'Em uso'");
    const [[{ manutencao }]] = await pool.query("SELECT COUNT(*) AS manutencao FROM maquinas WHERE status_maquina = 'Manutenção'");
    const [ultimas] = await pool.query('SELECT * FROM maquinas ORDER BY created_at DESC LIMIT 5');
    const [[{ totalUsuarios }]] = await pool.query('SELECT COUNT(*) AS totalUsuarios FROM usuarios');

    res.json({
      totalMaquinas,
      disponiveis,
      emUso,
      manutencao,
      totalUsuarios,
      ultimas
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar dados do dashboard.', error: error.message });
  }
});

app.get('/api/maquinas', requireAuth, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM maquinas ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar máquinas.', error: error.message });
  }
});

app.post('/api/maquinas', requireAuth, async (req, res) => {
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

app.delete('/api/maquinas/:id', requireAuth, async (req, res) => {
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

app.get('/api/usuarios', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, perfil, created_at FROM usuarios ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar usuários.', error: error.message });
  }
});

app.post('/api/usuarios', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (String(senha).length < 6) {
      return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [emailNormalizado]);

    if (existing.length) {
      return res.status(409).json({ message: 'Já existe um usuário com este e-mail.' });
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil)
       VALUES (?, ?, ?, ?)`,
      [nome, emailNormalizado, senhaHash, perfil === 'Administrador' ? 'Administrador' : 'Operador']
    );

    const [[novoUsuario]] = await pool.query(
      'SELECT id, nome, email, perfil, created_at FROM usuarios WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar usuário.', error: error.message });
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
