
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = await fs.readFile(path.join(__dirname, '..', 'database.sql'), 'utf8');
const statements = sql
  .split(/;\s*\n/g)
  .map(s => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await pool.query(statement);
}
console.log('Banco inicializado com sucesso.');
process.exit(0);
