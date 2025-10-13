import Database from 'better-sqlite3';

const db = new Database('servsolo.db');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL
);
`);

const products = [
  { id: 1, name: 'Kebab', price_cents: 1200 },
  { id: 2, name: 'HSP', price_cents: 1500 },
  { id: 3, name: 'Chips', price_cents: 600 },
  { id: 4, name: 'Snack Pack', price_cents: 1400 },
  { id: 5, name: 'Falafel Wrap', price_cents: 1100 },
  { id: 6, name: 'Chicken Wrap', price_cents: 1200 },
  { id: 7, name: 'Beef Wrap', price_cents: 1200 },
  { id: 8, name: 'Drink', price_cents: 300 }
];

const insert = db.prepare('INSERT OR REPLACE INTO products (id, name, price_cents) VALUES (?, ?, ?)');
for (const p of products) insert.run(p.id, p.name, p.price_cents);

console.log(`Seeded products: ${products.length}`);
