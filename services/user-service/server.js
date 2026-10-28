const express = require('express'); const { Pool } = require('pg'); const app = express(); app.use(express.json());
let requestCount = 0;
const pool = new Pool({ host: 'db-service', user: 'postgres', password: 'secret123', database: 'user_db', port: 5432 });
async function initDB() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100), role VARCHAR(50));`);
    const { rowCount } = await pool.query('SELECT * FROM users');
    if (rowCount === 0) {
      await pool.query(`INSERT INTO users (name, email, role) VALUES 
      ('BS. Lê Hoàng (Khoa Nội Tổng Quát)', 'bs.lehoang@medicare.com', 'DOCTOR'),
      ('BS. Trần B (Khoa Tim Mạch Chuyên Sâu)', 'bs.tranb@medicare.com', 'DOCTOR'),
      ('BS. Nguyễn C (Khoa Nhi & Tiêm Chủng)', 'bs.nguyenc@medicare.com', 'DOCTOR'),
      ('BS. Phạm D (Khoa Xương Khớp)', 'bs.phamd@medicare.com', 'DOCTOR'),
      ('BS. Lê E (Khoa Da Liễu)', 'bs.lee@medicare.com', 'DOCTOR'),
      ('BS. Trần F (Khoa Phụ Sản)', 'bs.tranf@medicare.com', 'DOCTOR');`);
    }
  } catch (err) { setTimeout(initDB, 4000); }
}
initDB();
app.get('/api/users', async (req, res) => { requestCount++; res.json((await pool.query('SELECT * FROM users ORDER BY id ASC')).rows); });
app.post('/api/users', async (req, res) => {
  requestCount++; const { name, email, role } = req.body;
  try {
    const exist = await pool.query('SELECT * FROM users WHERE name = $1 AND email = $2', [name, email]);
    if (exist.rowCount > 0) return res.json(exist.rows[0]);
    const r = await pool.query('INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *', [name, email, role || 'PATIENT_NEW']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/health', (req, res) => res.send('OK')); app.get('/metrics', (req, res) => res.send(`http_requests_total{service="user-service"} ${requestCount}\n`));
app.listen(3001, () => console.log('User Service v4 port 3001'));
