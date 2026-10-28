const express = require('express'); const { Pool } = require('pg'); const { Kafka } = require('kafkajs'); const app = express();
const pool = new Pool({ host: 'db-service', user: 'postgres', password: 'secret123', database: 'payment_db', port: 5432 });
const kafka = new Kafka({ clientId: 'payment-service', brokers: ['kafka-service:9092'] }); const consumer = kafka.consumer({ groupId: 'payment-group' });
async function init() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, reference_code VARCHAR(50), customer_name VARCHAR(100), amount INT, type VARCHAR(50), status VARCHAR(30) DEFAULT 'THÀNH CÔNG');`);
    await consumer.connect(); await consumer.subscribe({ topic: 'medical-events', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ message }) => {
        const payload = JSON.parse(message.value.toString());
        if (payload.event === 'APPOINTMENT_CREATED') await pool.query('INSERT INTO transactions (reference_code, customer_name, amount, type) VALUES ($1, $2, $3, $4)', [`KHAM-#${payload.data.id}`, payload.data.patient_name, 150000, 'PHÍ KHÁM BỆNH']);
        else if (payload.event === 'ORDER_CREATED') await pool.query('INSERT INTO transactions (reference_code, customer_name, amount, type) VALUES ($1, $2, $3, $4)', [`THUOC-#${payload.data.id}`, payload.data.user_name, payload.data.total_price, 'TIỀN MUA THUỐC']);
      },
    });
  } catch (err) { setTimeout(init, 4000); }
}
init();
app.get('/api/payments', async (req, res) => res.json((await pool.query('SELECT * FROM transactions ORDER BY id DESC')).rows));
app.get('/health', (req, res) => res.send('OK'));
app.listen(3005, () => console.log('Payment Service port 3005'));
