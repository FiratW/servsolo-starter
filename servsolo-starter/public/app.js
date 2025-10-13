const $ = s => document.querySelector(s);
let PRODUCTS = [];
let CART = [];

async function loadProducts(){
  const r = await fetch('/api/products');
  PRODUCTS = await r.json();
  renderProducts();
  renderCart();
}

function renderProducts(){
  const el = $('#products');
  el.innerHTML = '';
  PRODUCTS.forEach(p => {
    const b = document.createElement('button');
    b.textContent = `${p.name} - $${(p.price_cents/100).toFixed(2)}`;
    b.onclick = () => addToCart(p.id);
    el.appendChild(b);
  });
}

function addToCart(product_id){
  const existing = CART.find(i => i.product_id === product_id && !i.modifiers);
  if (existing) existing.qty += 1;
  else CART.push({ product_id, qty: 1 });
  renderCart();
}

function renderCart(){
  const el = $('#cart');
  let total = 0;
  const lines = CART.map(it => {
    const p = PRODUCTS.find(x=>x.id===it.product_id);
    const line = (p?.price_cents||0) * (it.qty||1);
    total += line;
    return `${p?.name||'#'+it.product_id} x${it.qty} - $${(line/100).toFixed(2)}`;
  });
  el.innerHTML = `
    <h3>Cart</h3>
    <div>${lines.join('<br>') || '(empty)'}</div>
    <div style="margin-top:8px"><strong>Total: $${(total/100).toFixed(2)}</strong></div>
    <div style="margin-top:8px"><button id="place">Place Order</button></div>
  `;
  $('#place')?.addEventListener('click', placeOrder);
}

async function placeOrder(){
  const payload = { items: CART.map(it => ({ product_id: it.product_id, qty: it.qty, modifiers: it.modifiers })) };
  const r = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const data = await r.json();
  alert('Order placed: #' + data.id);
  CART = [];
  renderCart();
}

document.addEventListener('DOMContentLoaded', loadProducts);
