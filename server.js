require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'klecoffee',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}_${safeBase}${ext}`);
  }
});
const upload = multer({ storage });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'klecoffee_secret_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.join(__dirname, 'public')));

function authRequired(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

async function seedAdminUser() {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@klecoffee.com']);
  if (rows.length) return;
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', ['Administrador', 'admin@klecoffee.com', hash]);
  console.log('Usuário admin criado: admin@klecoffee.com / admin123');
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'Servidor e MySQL conectados' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Email ou senha inválidos' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ou senha inválidos' });

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ message: 'Login realizado com sucesso', user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', authRequired, (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logout realizado' }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Não autenticado' });
  res.json(req.session.user);
});

app.get('/api/dashboard', authRequired, async (_req, res) => {
  try {
    const [[machines]] = await pool.query('SELECT COUNT(*) total FROM machines');
    const [[clients]] = await pool.query("SELECT COUNT(*) total FROM clients WHERE client_type = 'fixo'");
    const [[events]] = await pool.query('SELECT COUNT(*) total FROM events');
    const [[products]] = await pool.query('SELECT COUNT(*) total FROM products');
    const [[payments]] = await pool.query('SELECT IFNULL(SUM(amount),0) total FROM payments');
    const [maintenanceAlerts] = await pool.query(
      "SELECT id, brand, model, serial_number, next_maintenance FROM machines WHERE next_maintenance IS NOT NULL AND next_maintenance <= DATE_ADD(CURDATE(), INTERVAL 15 DAY) ORDER BY next_maintenance ASC LIMIT 10"
    );
    const [lowStock] = await pool.query(
      'SELECT id, name, stock_quantity, low_stock_alert FROM products WHERE stock_quantity <= low_stock_alert ORDER BY stock_quantity ASC LIMIT 10'
    );
    const [recentPayments] = await pool.query(
      'SELECT id, payment_type, customer_name, payment_date, amount, method FROM payments ORDER BY payment_date DESC, id DESC LIMIT 8'
    );
    res.json({
      totals: {
        machines: machines.total,
        fixedClients: clients.total,
        events: events.total,
        products: products.total,
        revenue: Number(payments.total)
      },
      maintenanceAlerts,
      lowStock,
      recentPayments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/machines/available', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*
      FROM machines m
      LEFT JOIN clients c ON c.machine_id = m.id AND c.status = 'ativo'
      WHERE m.status IN ('disponivel','em_uso')
        AND (c.id IS NULL OR c.client_type = 'evento')
      ORDER BY m.brand, m.model
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/machines', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, c.corporate_name AS allocated_to
      FROM machines m
      LEFT JOIN clients c ON c.machine_id = m.id AND c.status = 'ativo' AND c.client_type = 'fixo'
      ORDER BY m.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/machines', authRequired, upload.single('photo'), async (req, res) => {
  try {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const { serial_number, value, model, brand, status, last_maintenance, next_maintenance, notes } = req.body;
    await pool.query(
      `INSERT INTO machines (photo_url, serial_number, value, model, brand, status, last_maintenance, next_maintenance, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [photoUrl, serial_number, toNumber(value) || 0, model, brand, status || 'disponivel', last_maintenance || null, next_maintenance || null, notes || null]
    );
    res.json({ message: 'Máquina cadastrada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, m.brand, m.model, m.serial_number
      FROM clients c
      LEFT JOIN machines m ON m.id = c.machine_id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', authRequired, async (req, res) => {
  try {
    const {
      corporate_name, cnpj, contact_name, cpf, phone, email, address,
      payment_day, monthly_fee, machine_id, client_type, status
    } = req.body;

    await pool.query(
      `INSERT INTO clients 
      (corporate_name, cnpj, contact_name, cpf, phone, email, address, payment_day, monthly_fee, machine_id, client_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        corporate_name,
        cnpj || null,
        contact_name,
        cpf || null,
        phone || null,
        email || null,
        address || null,
        payment_day || null,
        client_type === 'evento' ? null : (toNumber(monthly_fee) || 0),
        machine_id || null,
        client_type || 'fixo',
        status || 'ativo'
      ]
    );

    if (machine_id) {
      await pool.query('UPDATE machines SET status = ? WHERE id = ?', ['em_uso', machine_id]);
    }

    res.json({ message: 'Cliente cadastrado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/events', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, c.corporate_name, c.contact_name, m.brand, m.model
      FROM events e
      INNER JOIN clients c ON c.id = e.client_id
      LEFT JOIN machines m ON m.id = e.machine_id
      ORDER BY e.start_date DESC, e.id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', authRequired, async (req, res) => {
  try {
    const { client_id, title, location, start_date, end_date, guests_count, estimated_value, machine_id, supplies_notes, status } = req.body;
    await pool.query(
      `INSERT INTO events (client_id, title, location, start_date, end_date, guests_count, estimated_value, machine_id, supplies_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_id, title, location || null, start_date, end_date || null, toNumber(guests_count), toNumber(estimated_value), machine_id || null, supplies_notes || null, status || 'orcamento']
    );
    if (machine_id) await pool.query('UPDATE machines SET status = ? WHERE id = ?', ['em_uso', machine_id]);
    res.json({ message: 'Evento cadastrado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *, ROUND(((sale_price - purchase_price) / NULLIF(purchase_price, 0)) * 100, 2) AS margin_percent
      FROM products
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', authRequired, upload.single('photo'), async (req, res) => {
  try {
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const { name, sku, category, purchase_price, sale_price, stock_quantity, low_stock_alert } = req.body;
    await pool.query(
      `INSERT INTO products (photo_url, name, sku, category, purchase_price, sale_price, stock_quantity, low_stock_alert)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [photoUrl, name, sku || null, category || null, toNumber(purchase_price) || 0, toNumber(sale_price) || 0, Number(stock_quantity || 0), Number(low_stock_alert || 5)]
    );
    res.json({ message: 'Produto cadastrado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payments ORDER BY payment_date DESC, id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', authRequired, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { payment_type, reference_id, customer_name, payment_date, amount, method, notes, items } = req.body;

    const [paymentResult] = await connection.query(
      `INSERT INTO payments (payment_type, reference_id, customer_name, payment_date, amount, method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payment_type, reference_id || null, customer_name, payment_date, toNumber(amount) || 0, method || 'pix', notes || null]
    );

    if (payment_type === 'venda_produto' && Array.isArray(items) && items.length) {
      for (const item of items) {
        const [productRows] = await connection.query('SELECT id, name, stock_quantity FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
        const product = productRows[0];
        if (!product) throw new Error('Produto não encontrado');
        if (product.stock_quantity < Number(item.quantity)) {
          throw new Error(`Estoque insuficiente para ${product.name}`);
        }
        const qty = Number(item.quantity);
        const unitPrice = Number(item.unit_price);
        const lineTotal = qty * unitPrice;
        await connection.query(
          'INSERT INTO payment_items (payment_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
          [paymentResult.insertId, item.product_id, qty, unitPrice, lineTotal]
        );
        await connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [qty, item.product_id]);
      }
    }

    await connection.commit();
    res.json({ message: 'Pagamento registrado com sucesso' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/payment-items/:paymentId', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pi.*, p.name AS product_name
      FROM payment_items pi
      INNER JOIN products p ON p.id = pi.product_id
      WHERE pi.payment_id = ?
    `, [req.params.paymentId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL conectado');
    await seedAdminUser();
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
})();
