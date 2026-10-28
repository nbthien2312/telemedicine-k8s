const express = require('express'); const { Pool } = require('pg'); const { Kafka } = require('kafkajs'); const app = express(); app.use(express.json());
let requestCount = 0; const pool = new Pool({ host: 'db-service', user: 'postgres', password: 'secret123', database: 'booking_db', port: 5432 });
const kafka = new Kafka({ clientId: 'booking-service', brokers: ['kafka-service:9092'] }); const producer = kafka.producer();
async function init() { try { await pool.query(`CREATE TABLE IF NOT EXISTS appointments (id SERIAL PRIMARY KEY, patient_name VARCHAR(100), contact_info VARCHAR(100), doctor_clinic VARCHAR(100), appointment_time VARCHAR(50), status VARCHAR(30) DEFAULT 'ĐÃ ĐẶT LỊCH');`); await producer.connect(); } catch (err) { setTimeout(init, 4000); } }
init();
app.get('/api/bookings', async (req, res) => { requestCount++; res.json((await pool.query('SELECT * FROM appointments ORDER BY id DESC')).rows); });
app.post('/api/bookings', async (req, res) => {
  requestCount++; const { patientName, contactInfo, doctorClinic, appointmentTime } = req.body;
  try {
    // Tự động báo sang User Service lưu khách hàng này
    fetch('http://user-service:3001/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: patientName, email: contactInfo, role: 'PATIENT_NEW' }) }).catch(e => console.log(e));
    
    const r = await pool.query('INSERT INTO appointments (patient_name, contact_info, doctor_clinic, appointment_time) VALUES ($1, $2, $3, $4) RETURNING *', [patientName, contactInfo, doctorClinic, appointmentTime]);
    await producer.send({ topic: 'medical-events', messages: [{ value: JSON.stringify({ event: 'APPOINTMENT_CREATED', data: r.rows[0] }) }] });
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/health', (req, res) => res.send('OK')); app.get('/metrics', (req, res) => res.send(`http_requests_total{service="booking-service"} ${requestCount}\n`));
app.listen(3004, () => console.log('Booking v3 port 3004'));
