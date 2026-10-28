const express = require('express'); const { Pool } = require('pg'); const { Kafka } = require('kafkajs'); const app = express(); app.use(express.json());
let requestCount = 0; const pool = new Pool({ host: 'db-service', user: 'postgres', password: 'secret123', database: 'order_db', port: 5432 });
const kafka = new Kafka({ clientId: 'order-service', brokers: ['kafka-service:9092'] }); const producer = kafka.producer();
async function init() { try { await pool.query(`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, customer_name VARCHAR(100), contact_info VARCHAR(100), product_name VARCHAR(150), quantity INT, total_price INT);`); await producer.connect(); } catch (err) { setTimeout(init, 4000); } }
init();
app.post('/api/orders', async (req, res) => {
  requestCount++; const { customerName, contactInfo, productId, quantity } = req.body;
  try {
    // Tự động báo sang User Service lưu khách hàng này
    fetch('http://user-service:3001/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: customerName, email: contactInfo, role: 'PATIENT_NEW' }) }).catch(e => console.log(e));

    const product = await fetch(`http://catalog-service:3002/api/products/${productId}`).then(r => r.json());
    const totalPrice = product.price * quantity;
    const r = await pool.query('INSERT INTO orders (customer_name, contact_info, product_name, quantity, total_price) VALUES ($1, $2, $3, $4, $5) RETURNING *', [customerName, contactInfo, product.name, quantity, totalPrice]);
    const payloadData = { ...r.rows[0], user_name: customerName, patient_name: customerName, product_name: product.name };
    await producer.send({ topic: 'medical-events', messages: [{ value: JSON.stringify({ event: 'ORDER_CREATED', data: payloadData }) }] });
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/health', (req, res) => res.send('OK')); app.get('/metrics', (req, res) => res.send(`http_requests_total{service="order-service"} ${requestCount}\n`));
app.listen(3003, () => console.log('Order v3 port 3003'));
