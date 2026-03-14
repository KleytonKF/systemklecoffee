
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'klecoffee-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

app.use('/img', express.static(path.join(publicDir, 'img')));
app.use(express.static(publicDir));

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

function mapRow(row) {
  return JSON.parse(JSON.stringify(row));
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows.map ? rows.map(mapRow) : rows;
}

async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return []; }
}

async function getMachineIdsByClient(clientId) {
  const rows = await query('SELECT machine_id FROM client_machines WHERE client_id = ?', [clientId]);
  return rows.map(r => r.machine_id);
}

async function getMachinesByEvent(eventId) {
  const rows = await query('SELECT machine_id FROM event_machines WHERE event_id = ?', [eventId]);
  return rows.map(r => r.machine_id);
}

async function getSuppliesByEvent(eventId) {
  return await query('SELECT product_id as id, quantity as quantidade FROM event_supplies WHERE event_id = ?', [eventId]);
}

async function hydrateClients(rows) {
  const result = [];
  for (const row of rows) {
    result.push({
      ...row,
      maquinas: await getMachineIdsByClient(row.id)
    });
  }
  return result;
}

async function hydrateEvents(rows) {
  const result = [];
  for (const row of rows) {
    result.push({
      ...row,
      clienteId: row.cliente_id,
      nomeEvento: row.nome_evento,
      dataInicio: row.data_inicio,
      dataFim: row.data_fim,
      logradouro: row.logradouro,
      numero: row.numero,
      bairro: row.bairro || '',
      cidade: row.cidade,
      uf: row.uf,
      cep: row.cep || '',
      status: row.status,
      observacoes: row.observacoes || '',
      maquinas: await getMachinesByEvent(row.id),
      insumos: await getSuppliesByEvent(row.id)
    });
  }
  return result;
}

async function dashboardData() {
  const [counts] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM machines) AS totalMaquinas,
      (SELECT COUNT(*) FROM clients) AS totalClientes,
      (SELECT COUNT(*) FROM events) AS totalEventos,
      (SELECT COUNT(*) FROM products) AS totalProdutos,
      (SELECT COUNT(*) FROM payments) AS totalPagamentos
  `);

  const paymentRows = await query(`
    SELECT DATE_FORMAT(data, '%Y-%m') AS mes, SUM(valor) AS total
    FROM payments
    GROUP BY DATE_FORMAT(data, '%Y-%m')
    ORDER BY mes ASC
  `);

  const byType = await query(`
    SELECT tipo, SUM(valor) AS total
    FROM payments
    GROUP BY tipo
  `);

  const stock = await query(`
    SELECT
      SUM(CASE WHEN quantidade < 20 THEN 1 ELSE 0 END) AS estoqueBaixo,
      SUM(CASE WHEN quantidade BETWEEN 20 AND 49 THEN 1 ELSE 0 END) AS estoqueNormal,
      SUM(CASE WHEN quantidade >= 50 THEN 1 ELSE 0 END) AS estoqueAlto
    FROM products
  `);

  const eventStatus = await query(`
    SELECT status, COUNT(*) AS total
    FROM events
    GROUP BY status
  `);

  const recentPayments = await query(`
    SELECT * FROM payments
    ORDER BY data DESC, id DESC
    LIMIT 5
  `);

  return {
    ...(counts[0] || {}),
    pagamentosPorMes: paymentRows,
    receitasPorTipo: byType,
    estoqueResumo: stock[0] || { estoqueBaixo: 0, estoqueNormal: 0, estoqueAlto: 0 },
    eventosPorStatus: eventStatus,
    ultimosPagamentos: recentPayments
  };
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'klecoffee', uptime: process.uptime() });
});

app.get('/api/logo-status', (_req, res) => {
  const logoPath = path.join(publicDir, 'img', 'logo-klecoffee.png');
  res.json({ exists: fs.existsSync(logoPath), path: '/img/logo-klecoffee.png' });
});

app.post('/api/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;
  const user = await one('SELECT * FROM users WHERE usuario = ? AND status = "ativo"', [username]);
  if (!user) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

  const ok = user.password_hash
    ? await bcrypt.compare(password, user.password_hash)
    : user.senha === password;

  if (!ok) return res.status(401).json({ error: 'Usuário ou senha incorretos.' });

  req.session.user = {
    id: user.id,
    nome: user.nome,
    usuario: user.usuario,
    email: user.email,
    nivel: user.nivel
  };

  if (rememberMe) req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
  res.json({ ok: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.get('/api/bootstrap', requireAuth, async (_req, res) => {
  const maquinas = await query('SELECT * FROM machines ORDER BY id DESC');
  const produtos = await query('SELECT * FROM products ORDER BY id DESC');
  const clientes = await hydrateClients(await query('SELECT * FROM clients ORDER BY id DESC'));
  const eventos = await hydrateEvents(await query('SELECT * FROM events ORDER BY id DESC'));
  const pagamentos = await query('SELECT * FROM payments ORDER BY data DESC, id DESC');
  const usuarios = await query('SELECT id, nome, usuario, email, nivel, status FROM users ORDER BY id ASC');
  const configuracoes = await one('SELECT * FROM app_settings WHERE id = 1');
  const dashboard = await dashboardData();

  res.json({ maquinas, produtos, clientes, eventos, pagamentos, usuarios, configuracoes, dashboard });
});

app.get('/api/maquinas', requireAuth, async (_req, res) => {
  res.json(await query('SELECT * FROM machines ORDER BY id DESC'));
});
app.post('/api/maquinas', requireAuth, async (req, res) => {
  const { marca, modelo, sn, valor, imagem } = req.body;
  const [result] = await pool.query('INSERT INTO machines (marca, modelo, sn, valor, imagem) VALUES (?, ?, ?, ?, ?)', [marca, modelo, sn, valor, imagem || '']);
  res.json({ id: result.insertId });
});
app.put('/api/maquinas/:id', requireAuth, async (req, res) => {
  const { marca, modelo, sn, valor, imagem } = req.body;
  await pool.query('UPDATE machines SET marca=?, modelo=?, sn=?, valor=?, imagem=? WHERE id=?', [marca, modelo, sn, valor, imagem || '', req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/maquinas/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM client_machines WHERE machine_id=?', [req.params.id]);
  await pool.query('DELETE FROM event_machines WHERE machine_id=?', [req.params.id]);
  await pool.query('DELETE FROM machines WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/produtos', requireAuth, async (_req, res) => {
  res.json(await query('SELECT * FROM products ORDER BY id DESC'));
});
app.post('/api/produtos', requireAuth, async (req, res) => {
  const { nome, imagem, valorCompra, valorVenda, margem, quantidade } = req.body;
  const [result] = await pool.query(
    'INSERT INTO products (nome, imagem, valor_compra, valor_venda, margem, quantidade) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, imagem || '', valorCompra, valorVenda, margem, quantidade]
  );
  res.json({ id: result.insertId });
});
app.put('/api/produtos/:id', requireAuth, async (req, res) => {
  const { nome, imagem, valorCompra, valorVenda, margem, quantidade } = req.body;
  await pool.query(
    'UPDATE products SET nome=?, imagem=?, valor_compra=?, valor_venda=?, margem=?, quantidade=? WHERE id=?',
    [nome, imagem || '', valorCompra, valorVenda, margem, quantidade, req.params.id]
  );
  res.json({ ok: true });
});
app.delete('/api/produtos/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM event_supplies WHERE product_id=?', [req.params.id]);
  await pool.query('DELETE FROM payments WHERE produto_id=?', [req.params.id]);
  await pool.query('DELETE FROM products WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/clientes', requireAuth, async (_req, res) => {
  res.json(await hydrateClients(await query('SELECT * FROM clients ORDER BY id DESC')));
});
app.post('/api/clientes', requireAuth, async (req, res) => {
  const c = req.body;
  const [result] = await pool.query(`
    INSERT INTO clients
    (tipo, razao_social, cnpj, nome_completo, cpf, contato, email, logradouro, numero, complemento, bairro, cidade, uf, cep, valor_locacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    c.tipo, c.razaoSocial, c.cnpj, c.nomeCompleto, c.cpf, c.contato, c.email, c.logradouro,
    c.numero, c.complemento || '', c.bairro, c.cidade, c.uf, c.cep, c.valorLocacao || null
  ]);
  const clientId = result.insertId;
  const maquinas = parseArray(c.maquinas);
  for (const machineId of maquinas) {
    await pool.query('INSERT INTO client_machines (client_id, machine_id) VALUES (?, ?)', [clientId, machineId]);
  }
  res.json({ id: clientId });
});
app.put('/api/clientes/:id', requireAuth, async (req, res) => {
  const c = req.body;
  await pool.query(`
    UPDATE clients SET
    tipo=?, razao_social=?, cnpj=?, nome_completo=?, cpf=?, contato=?, email=?, logradouro=?, numero=?,
    complemento=?, bairro=?, cidade=?, uf=?, cep=?, valor_locacao=?
    WHERE id=?
  `, [
    c.tipo, c.razaoSocial, c.cnpj, c.nomeCompleto, c.cpf, c.contato, c.email, c.logradouro,
    c.numero, c.complemento || '', c.bairro, c.cidade, c.uf, c.cep, c.valorLocacao || null, req.params.id
  ]);
  await pool.query('DELETE FROM client_machines WHERE client_id=?', [req.params.id]);
  for (const machineId of parseArray(c.maquinas)) {
    await pool.query('INSERT INTO client_machines (client_id, machine_id) VALUES (?, ?)', [req.params.id, machineId]);
  }
  res.json({ ok: true });
});
app.delete('/api/clientes/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM client_machines WHERE client_id=?', [req.params.id]);
  await pool.query('DELETE FROM payments WHERE cliente_id=?', [req.params.id]);
  await pool.query('DELETE FROM events WHERE cliente_id=?', [req.params.id]);
  await pool.query('DELETE FROM clients WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/eventos', requireAuth, async (_req, res) => {
  res.json(await hydrateEvents(await query('SELECT * FROM events ORDER BY id DESC')));
});
app.post('/api/eventos', requireAuth, async (req, res) => {
  const e = req.body;
  const [result] = await pool.query(`
    INSERT INTO events
    (cliente_id, nome_evento, data_inicio, data_fim, logradouro, numero, bairro, cidade, uf, cep, status, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    e.clienteId, e.nomeEvento, e.dataInicio, e.dataFim, e.logradouro, e.numero,
    e.bairro || '', e.cidade, e.uf, e.cep || '', e.status || 'proximo', e.observacoes || ''
  ]);
  const eventId = result.insertId;
  for (const machineId of parseArray(e.maquinas)) {
    await pool.query('INSERT INTO event_machines (event_id, machine_id) VALUES (?, ?)', [eventId, machineId]);
  }
  for (const item of parseArray(e.insumos)) {
    await pool.query('INSERT INTO event_supplies (event_id, product_id, quantity) VALUES (?, ?, ?)', [eventId, item.id, item.quantidade]);
    await pool.query('UPDATE products SET quantidade = GREATEST(quantidade - ?, 0) WHERE id=?', [item.quantidade, item.id]);
  }
  res.json({ id: eventId });
});
app.put('/api/eventos/:id', requireAuth, async (req, res) => {
  const e = req.body;
  await pool.query(`
    UPDATE events SET
    cliente_id=?, nome_evento=?, data_inicio=?, data_fim=?, logradouro=?, numero=?, bairro=?, cidade=?, uf=?, cep=?, status=?, observacoes=?
    WHERE id=?
  `, [
    e.clienteId, e.nomeEvento, e.dataInicio, e.dataFim, e.logradouro, e.numero, e.bairro || '',
    e.cidade, e.uf, e.cep || '', e.status || 'proximo', e.observacoes || '', req.params.id
  ]);
  await pool.query('DELETE FROM event_machines WHERE event_id=?', [req.params.id]);
  for (const machineId of parseArray(e.maquinas)) {
    await pool.query('INSERT INTO event_machines (event_id, machine_id) VALUES (?, ?)', [req.params.id, machineId]);
  }
  res.json({ ok: true });
});
app.delete('/api/eventos/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM event_machines WHERE event_id=?', [req.params.id]);
  await pool.query('DELETE FROM event_supplies WHERE event_id=?', [req.params.id]);
  await pool.query('DELETE FROM payments WHERE evento_id=?', [req.params.id]);
  await pool.query('DELETE FROM events WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/pagamentos', requireAuth, async (_req, res) => {
  res.json(await query('SELECT * FROM payments ORDER BY data DESC, id DESC'));
});
app.post('/api/pagamentos', requireAuth, async (req, res) => {
  const p = req.body;
  const [result] = await pool.query(`
    INSERT INTO payments (tipo, cliente_id, evento_id, produto_id, descricao, valor, data, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    p.tipo, p.clienteId || null, p.eventoId || null, p.produtoId || null, p.descricao, p.valor, p.data, p.status
  ]);
  if (p.tipo === 'venda' && p.produtoId && p.quantidade) {
    await pool.query('UPDATE products SET quantidade = GREATEST(quantidade - ?, 0) WHERE id=?', [p.quantidade, p.produtoId]);
  }
  res.json({ id: result.insertId });
});
app.put('/api/pagamentos/:id', requireAuth, async (req, res) => {
  const p = req.body;
  await pool.query('UPDATE payments SET descricao=?, valor=?, data=?, status=? WHERE id=?', [p.descricao, p.valor, p.data, p.status, req.params.id]);
  res.json({ ok: true });
});
app.delete('/api/pagamentos/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM payments WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/usuarios', requireAuth, async (_req, res) => {
  res.json(await query('SELECT id, nome, usuario, email, nivel, status FROM users ORDER BY id ASC'));
});
app.post('/api/usuarios', requireAuth, async (req, res) => {
  const u = req.body;
  const hash = await bcrypt.hash(u.senha, 10);
  const [result] = await pool.query(
    'INSERT INTO users (nome, usuario, senha, password_hash, email, nivel, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [u.nome, u.usuario, u.senha, hash, u.email, u.nivel, 'ativo']
  );
  res.json({ id: result.insertId });
});
app.put('/api/usuarios/:id', requireAuth, async (req, res) => {
  const u = req.body;
  if (u.senha) {
    const hash = await bcrypt.hash(u.senha, 10);
    await pool.query('UPDATE users SET nome=?, usuario=?, email=?, nivel=?, status=?, senha=?, password_hash=? WHERE id=?',
      [u.nome, u.usuario, u.email, u.nivel, u.status, u.senha, hash, req.params.id]);
  } else {
    await pool.query('UPDATE users SET nome=?, usuario=?, email=?, nivel=?, status=? WHERE id=?',
      [u.nome, u.usuario, u.email, u.nivel, u.status, req.params.id]);
  }
  res.json({ ok: true });
});
app.delete('/api/usuarios/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

app.get('/api/configuracoes', requireAuth, async (_req, res) => {
  res.json(await one('SELECT * FROM app_settings WHERE id=1'));
});
app.put('/api/configuracoes', requireAuth, async (req, res) => {
  const { tempoSessao, maxTentativas, exigirSenhaForte } = req.body;
  await pool.query('UPDATE app_settings SET tempo_sessao=?, max_tentativas=?, exigir_senha_forte=? WHERE id=1',
    [tempoSessao, maxTentativas, exigirSenhaForte ? 1 : 0]);
  res.json({ ok: true });
});

app.get('/api/dashboard', requireAuth, async (_req, res) => {
  res.json(await dashboardData());
});

app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

const server = app.listen(PORT, HOST, () => {
  console.log(`KleCoffee rodando em http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  console.error('Erro ao iniciar servidor:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando aplicação...');
  server.close(() => process.exit(0));
});
