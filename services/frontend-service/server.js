const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public')); // Phục vụ giao diện HTML/CSS

// --- API GATEWAY ROUTING ---
const fetchJson = async (url, options) => {
  try { const r = await fetch(url, options); return await r.json(); } catch(e) { return { error: e.message }; }
};

app.get('/api/users', async (req, res) => res.json(await fetchJson('http://user-service:3001/api/users')));
app.get('/api/products', async (req, res) => res.json(await fetchJson('http://catalog-service:3002/api/products')));
app.get('/api/bookings', async (req, res) => res.json(await fetchJson('http://booking-service:3004/api/bookings')));
app.post('/api/bookings', async (req, res) => res.json(await fetchJson('http://booking-service:3004/api/bookings', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req.body)})));
app.get('/api/orders', async (req, res) => res.json(await fetchJson('http://order-service:3003/api/full-dashboard'))); // Lấy từ Order dashboard
app.post('/api/orders', async (req, res) => res.json(await fetchJson('http://order-service:3003/api/orders', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req.body)})));
app.get('/api/payments', async (req, res) => res.json(await fetchJson('http://payment-service:3005/api/payments')));
app.get('/api/notifications', async (req, res) => res.json(await fetchJson('http://notification-service:3006/api/notifications')));
app.get('/api/ai-status', async (req, res) => res.json(await fetchJson('http://ai-autoscaler:3007/api/ai-status')));

app.listen(80, () => console.log('Frontend API Gateway chạy ở port 80'));
