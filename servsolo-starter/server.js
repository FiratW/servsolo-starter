import express from 'express';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database('servsolo.db');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  items_json TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Modifiers + /api/menu
const MODIFIER_GROUPS = [
  { id: 1, name: 'Meat', required: 1, max_choices: 1 },
  { id: 2, name: 'Sauces', required: 0, max_choices: 3 },
  { id: 3, name: 'Size', required: 1, max_choices: 1 },
  { id: 4, name: 'Extras', required: 0, max_choices: 5 },
];
const MODIFIERS = [
  { id: 101, group_id: 1, name: 'Chicken', price_delta_cents: 0 },
  { id: 102, group_id: 1, name: 'Beef',    price_delta_cents: 0 },
  { id: 103, group_id: 1, name: 'Mix',     price_delta_cents: 100 },
  { id: 201, group_id: 2, name: 'Garlic',  price_delta_cents: 0 },
  { id: 202, group_id: 2, name: 'BBQ',     price_delta_cents: 0 },
  { id: 203, group_id: 2, name: 'Chili',   price_delta_cents: 0 },
  { id: 204, group_id: 2, name: 'Tomato',  price_delta_cents: 0 },
  { id: 205, group_id: 2, name: 'Mayo',    price_delta_cents: 0 },
  { id: 301, group_id: 3, name: 'Small',   price_delta_cents: -100 },
  { id: 302, group_id: 3, name: 'Regular', price_delta_cents: 0 },
  { id: 303, group_id: 3, name: 'Large',   price_delta_cents: 200 },
  { id: 401, group_id: 4, name: 'Cheese',     price_delta_cents: 100 },
  { id: 402, group_id: 4, name: 'Extra Meat', price_delta_cents: 300 },
  { id: 403, group_id: 4, name: 'Onion',      price_delta_cents: 0 },
  { id: 404, group_id: 4, name: 'Lettuce',    price_delta_cents: 0 },
  { id: 405, group_id: 4, name: 'Tomato',     price_delta_cents: 0 },
];
const PRODUCT_GROUPS = [
  { product_id: 1, group_id: 1 },
  { product_id: 1, group_id: 2 },
  { product_id: 1, group_id: 4 },
  { product_id: 2, group_id: 1 },
  { product_id: 2, group_id: 2 },
  { product_id: 2, group_id: 4 },
  { product_id: 3, group_id: 3 },
  { product_id: 3, group_id: 4 },
];
function buildMenuPayload() {
  const byGroup = {};
  for (const m of MODIFIERS) (byGroup[m.group_id] ||= []).push(m);
  const groups = MODIFIER_GROUPS.map(g => ({ ...g, modifiers: byGroup[g.id] || [] }));
  return { groups, product_groups: PRODUCT_GROUPS };
}
app.get('/api/menu', (req, res) => res.json(buildMenuPayload()));

function priceForItem(item) {
  const p = db.prepare('SELECT price_cents FROM products WHERE id=?').get(item.product_id);
  if (!p) return 0;
  const qty = Number(item.qty || 1);
  let base = p.price_cents * qty;

  let add = 0;
  const selected = Array.isArray(item.modifiers) ? item.modifiers : [];
  for (const sel of selected) {
    const mids = Array.isArray(sel.modifier_ids) ? sel.modifier_ids : [];
    for (const mid of mids) {
      const mod = MODIFIERS.find(mm => mm.id === Number(mid));
      if (mod) add += mod.price_delta_cents;
    }
  }
  return base + (add * qty);
}

app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT id, name, price_cents FROM products ORDER BY id').all();
  res.json(rows);
});

app.get('/api/orders', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 100').all();
  res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json) })));
});

app.post('/api/orders', (req, res) => {
  const payload = req.body || {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  const total = items.reduce((sum, it) => sum + priceForItem(it), 0);

  const ins = db.prepare(`INSERT INTO orders (items_json, customer_name, notes, status, total_cents, created_at)
                          VALUES (?, ?, ?, 'new', ?, datetime('now'))`);
  const info = ins.run(JSON.stringify(items), payload.customer_name || null, payload.notes || null, total);
  res.json({ ok: true, id: info.lastInsertRowid, total_cents: total });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servsolo running on http://localhost:${PORT}`);
});
