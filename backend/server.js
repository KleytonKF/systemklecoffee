import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function parseJsonField(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}
function toMachine(row) {
  return { id: row.id, marca: row.marca, modelo: row.modelo, sn: row.sn, valor: Number(row.valor), imagem: row.imagem || '' };
}
function toProduto(row) {
  return { id: row.id, nome: row.nome, imagem: row.imagem || '', valorCompra: Number(row.valor_compra), valorVenda: Number(row.valor_venda), margem: Number(row.margem), quantidade: Number(row.quantidade) };
}
function toCliente(row) {
  return {
    id: row.id, tipo: row.tipo, razaoSocial: row.razao_social, cnpj: row.cnpj, nomeCompleto: row.nome_completo,
    cpf: row.cpf, contato: row.contato, email: row.email, logradouro: row.logradouro, numero: row.numero,
    complemento: row.complemento || '', bairro: row.bairro, cidade: row.cidade, uf: row.uf, cep: row.cep,
    maquinas: parseJsonField(row.maquinas_json, []), valorLocacao: row.valor_locacao == null ? null : Number(row.valor_locacao)
  };
}
function toEvento(row) {
  return {
    id: row.id, clienteId: row.cliente_id, nomeEvento: row.nome_evento, dataInicio: row.data_inicio, dataFim: row.data_fim,
    logradouro: row.logradouro, numero: row.numero, bairro: row.bairro || '', cidade: row.cidade, uf: row.uf, cep: row.cep || '',
    maquinas: parseJsonField(row.maquinas_json, []), insumos: parseJsonField(row.insumos_json, []), status: row.status, observacoes: row.observacoes || ''
  };
}
function toPagamento(row) {
  return { id: row.id, tipo: row.tipo, clienteId: row.cliente_id, eventoId: row.evento_id, produtoId: row.produto_id, descricao: row.descricao, valor: Number(row.valor), data: row.data, status: row.status };
}
function toUsuario(row) {
  return { id: row.id, nome: row.nome, usuario: row.usuario, senha: row.senha, email: row.email, nivel: row.nivel, status: row.status };
}

async function getById(table, id) {
  const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

app.get('/api/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ ok: true, message: 'Conectado ao MySQL com sucesso.' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Falha ao conectar ao MySQL.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body || {};
    if (!usuario || !senha) return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? AND senha = ? AND status = "ativo" LIMIT 1', [usuario, senha]);
    if (!rows.length) return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
    res.json(toUsuario(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Erro ao autenticar.', error: error.message });
  }
});

app.get('/api/maquinas', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM maquinas ORDER BY id ASC');
  res.json(rows.map(toMachine));
});
app.post('/api/maquinas', async (req, res) => {
  const d = req.body || {};
  const [result] = await pool.query('INSERT INTO maquinas (marca, modelo, sn, valor, imagem) VALUES (?, ?, ?, ?, ?)', [d.marca, d.modelo, d.sn, d.valor, d.imagem || '']);
  res.status(201).json(toMachine(await getById('maquinas', result.insertId)));
});
app.put('/api/maquinas/:id', async (req, res) => {
  const id = Number(req.params.id); const d = req.body || {};
  await pool.query('UPDATE maquinas SET marca = ?, modelo = ?, sn = ?, valor = ?, imagem = ? WHERE id = ?', [d.marca, d.modelo, d.sn, d.valor, d.imagem || '', id]);
  const row = await getById('maquinas', id); if (!row) return res.status(404).json({ message: 'Máquina não encontrada.' });
  res.json(toMachine(row));
});
app.delete('/api/maquinas/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM maquinas WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Máquina não encontrada.' });
  res.json({ ok: true });
});

app.get('/api/produtos', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
  res.json(rows.map(toProduto));
});
app.post('/api/produtos', async (req, res) => {
  const d = req.body || {};
  const [result] = await pool.query('INSERT INTO produtos (nome, imagem, valor_compra, valor_venda, margem, quantidade) VALUES (?, ?, ?, ?, ?, ?)', [d.nome, d.imagem || '', d.valorCompra, d.valorVenda, d.margem, d.quantidade]);
  res.status(201).json(toProduto(await getById('produtos', result.insertId)));
});
app.put('/api/produtos/:id', async (req, res) => {
  const id = Number(req.params.id); const d = req.body || {};
  await pool.query('UPDATE produtos SET nome = ?, imagem = ?, valor_compra = ?, valor_venda = ?, margem = ?, quantidade = ? WHERE id = ?', [d.nome, d.imagem || '', d.valorCompra, d.valorVenda, d.margem, d.quantidade, id]);
  const row = await getById('produtos', id); if (!row) return res.status(404).json({ message: 'Produto não encontrado.' });
  res.json(toProduto(row));
});
app.delete('/api/produtos/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM produtos WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Produto não encontrado.' });
  res.json({ ok: true });
});

app.get('/api/clientes', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM clientes ORDER BY id ASC');
  res.json(rows.map(toCliente));
});
app.post('/api/clientes', async (req, res) => {
  const d = req.body || {};
  const [result] = await pool.query(
    'INSERT INTO clientes (tipo, razao_social, cnpj, nome_completo, cpf, contato, email, logradouro, numero, complemento, bairro, cidade, uf, cep, maquinas_json, valor_locacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [d.tipo, d.razaoSocial, d.cnpj, d.nomeCompleto, d.cpf, d.contato, d.email, d.logradouro, d.numero, d.complemento || '', d.bairro, d.cidade, d.uf, d.cep, JSON.stringify(d.maquinas || []), d.valorLocacao ?? null]
  );
  res.status(201).json(toCliente(await getById('clientes', result.insertId)));
});
app.put('/api/clientes/:id', async (req, res) => {
  const id = Number(req.params.id); const d = req.body || {};
  await pool.query(
    'UPDATE clientes SET tipo = ?, razao_social = ?, cnpj = ?, nome_completo = ?, cpf = ?, contato = ?, email = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, maquinas_json = ?, valor_locacao = ? WHERE id = ?',
    [d.tipo, d.razaoSocial, d.cnpj, d.nomeCompleto, d.cpf, d.contato, d.email, d.logradouro, d.numero, d.complemento || '', d.bairro, d.cidade, d.uf, d.cep, JSON.stringify(d.maquinas || []), d.valorLocacao ?? null, id]
  );
  const row = await getById('clientes', id); if (!row) return res.status(404).json({ message: 'Cliente não encontrado.' });
  res.json(toCliente(row));
});
app.delete('/api/clientes/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Cliente não encontrado.' });
  res.json({ ok: true });
});

app.get('/api/eventos', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM eventos ORDER BY id ASC');
  res.json(rows.map(toEvento));
});
app.post('/api/eventos', async (req, res) => {
  const d = req.body || {};
  const [result] = await pool.query(
    'INSERT INTO eventos (cliente_id, nome_evento, data_inicio, data_fim, logradouro, numero, bairro, cidade, uf, cep, maquinas_json, insumos_json, status, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [d.clienteId, d.nomeEvento, d.dataInicio, d.dataFim, d.logradouro, d.numero, d.bairro || '', d.cidade, d.uf, d.cep || '', JSON.stringify(d.maquinas || []), JSON.stringify(d.insumos || []), d.status || 'proximo', d.observacoes || '']
  );
  res.status(201).json(toEvento(await getById('eventos', result.insertId)));
});
app.put('/api/eventos/:id', async (req, res) => {
  const id = Number(req.params.id); const d = req.body || {};
  await pool.query(
    'UPDATE eventos SET cliente_id = ?, nome_evento = ?, data_inicio = ?, data_fim = ?, logradouro = ?, numero = ?, bairro = ?, cidade = ?, uf = ?, cep = ?, maquinas_json = ?, insumos_json = ?, status = ?, observacoes = ? WHERE id = ?',
    [d.clienteId, d.nomeEvento, d.dataInicio, d.dataFim, d.logradouro, d.numero, d.bairro || '', d.cidade, d.uf, d.cep || '', JSON.stringify(d.maquinas || []), JSON.stringify(d.insumos || []), d.status || 'proximo', d.observacoes || '', id]
  );
  const row = await getById('eventos', id); if (!row) return res.status(404).json({ message: 'Evento não encontrado.' });
  res.json(toEvento(row));
});
app.delete('/api/eventos/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM eventos WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Evento não encontrado.' });
  res.json({ ok: true });
});

app.get('/api/pagamentos', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM pagamentos ORDER BY data DESC, id DESC');
  res.json(rows.map(toPagamento));
});
app.post('/api/pagamentos', async (req, res) => {
  const d = req.body || {};
  const [result] = await pool.query('INSERT INTO pagamentos (tipo, cliente_id, evento_id, produto_id, descricao, valor, data, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [d.tipo, d.clienteId ?? null, d.eventoId ?? null, d.produtoId ?? null, d.descricao, d.valor, d.data, d.status || 'pago']);
  res.status(201).json(toPagamento(await getById('pagamentos', result.insertId)));
});
app.put('/api/pagamentos/:id', async (req, res) => {
  const id = Number(req.params.id); const d = req.body || {};
  await pool.query('UPDATE pagamentos SET tipo = ?, cliente_id = ?, evento_id = ?, produto_id = ?, descricao = ?, valor = ?, data = ?, status = ? WHERE id = ?', [d.tipo, d.clienteId ?? null, d.eventoId ?? null, d.produtoId ?? null, d.descricao, d.valor, d.data, d.status || 'pago', id]);
  const row = await getById('pagamentos', id); if (!row) return res.status(404).json({ message: 'Pagamento não encontrado.' });
  res.json(toPagamento(row));
});
app.delete('/api/pagamentos/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM pagamentos WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Pagamento não encontrado.' });
  res.json({ ok: true });
});

app.get('/api/usuarios', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
  res.json(rows.map(toUsuario));
});
app.post('/api/usuarios', async (req, res) => {
  const d = req.body || {};
  const [result] = await pool.query('INSERT INTO usuarios (nome, usuario, senha, email, nivel, status) VALUES (?, ?, ?, ?, ?, ?)', [d.nome, d.usuario, d.senha, d.email, d.nivel || 'operador', d.status || 'ativo']);
  res.status(201).json(toUsuario(await getById('usuarios', result.insertId)));
});
app.put('/api/usuarios/:id', async (req, res) => {
  const id = Number(req.params.id); const d = req.body || {};
  await pool.query('UPDATE usuarios SET nome = ?, usuario = ?, senha = ?, email = ?, nivel = ?, status = ? WHERE id = ?', [d.nome, d.usuario, d.senha, d.email, d.nivel || 'operador', d.status || 'ativo', id]);
  const row = await getById('usuarios', id); if (!row) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json(toUsuario(row));
});
app.delete('/api/usuarios/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json({ ok: true });
});

app.get('/api/configuracoes', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM configuracoes WHERE id = 1 LIMIT 1');
  const row = rows[0] || { id: 1, tempo_sessao: 30, max_tentativas: 3, exigir_senha_forte: 1 };
  res.json({ id: row.id, tempoSessao: Number(row.tempo_sessao), maxTentativas: Number(row.max_tentativas), exigirSenhaForte: Boolean(row.exigir_senha_forte) });
});
app.put('/api/configuracoes', async (req, res) => {
  const { tempoSessao, maxTentativas, exigirSenhaForte } = req.body || {};
  await pool.query('UPDATE configuracoes SET tempo_sessao = ?, max_tentativas = ?, exigir_senha_forte = ? WHERE id = 1', [tempoSessao, maxTentativas, exigirSenhaForte ? 1 : 0]);
  res.json({ ok: true });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Erro interno no servidor.', error: err.message });
});

app.listen(PORT, () => {
  console.log(`KleCoffee rodando na porta ${PORT}`);
});
