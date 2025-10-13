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

// Sample menu API
app.get('/api/menu', (req,res)=>{
  res.json({
    groups:[
      {id:1,name:'Meat',required:1,max_choices:1,modifiers:[
        {id:101,group_id:1,name:'Chicken',price_delta_cents:0},
        {id:102,group_id:1,name:'Beef',price_delta_cents:0}
      ]},
      {id:2,name:'Sauces',required:0,max_choices:3,modifiers:[
        {id:201,group_id:2,name:'Garlic',price_delta_cents:0},
        {id:202,group_id:2,name:'BBQ',price_delta_cents:0}
      ]}
    ],
    product_groups:[]
  });
});

app.get('/api/products',(req,res)=>{
  const rows=db.prepare('SELECT id,name,price_cents FROM products').all();
  res.json(rows);
});

app.get('/api/orders',(req,res)=>{
  const rows=db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows.map(r=>({...r,items:JSON.parse(r.items_json)})));
});

app.post('/api/orders',(req,res)=>{
  const payload=req.body||{};
  const items=Array.isArray(payload.items)?payload.items:[];
  const total=items.reduce((sum,it)=>{
    const p=db.prepare('SELECT price_cents FROM products WHERE id=?').get(it.product_id);
    return sum+(p?(p.price_cents*it.qty):0);
  },0);
  const ins=db.prepare('INSERT INTO orders (items_json,total_cents) VALUES (?,?)');
  const info=ins.run(JSON.stringify(items),total);
  res.json({ok:true,id:info.lastInsertRowid,total_cents:total});
});

app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,'public','index.html'));
});

app.listen(3000,()=>console.log('Servsolo running on http://localhost:3000'));
