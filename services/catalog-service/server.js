const express = require('express'); const { Pool } = require('pg'); const app = express(); app.use(express.json());
let requestCount = 0;
const pool = new Pool({ host: 'db-service', user: 'postgres', password: 'secret123', database: 'catalog_db', port: 5432 });
async function initDB() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(150), brand VARCHAR(50), price INT, stock INT);`);
    const { rowCount } = await pool.query('SELECT * FROM products');
    if (rowCount === 0) await pool.query(`INSERT INTO products (name, brand, price, stock) VALUES 
      ('Thuốc giảm đau Paracetamol 500mg', 'DHG', 35000, 500), ('Vitamin C 1000mg', 'Bayer', 65000, 300), 
      ('Máy đo huyết áp điện tử Omron', 'Omron', 850000, 50), ('Khẩu trang Y tế 4 lớp (Hộp 50 cái)', 'Pharmacity', 45000, 1000),
      ('Nước muối sinh lý Natri Clorid 0.9%', 'Pharmedic', 5000, 2000), ('Thuốc ho Bảo Thanh', 'Hoa Linh', 45000, 150),
      ('Men tiêu hóa Enterogermina', 'Sanofi', 150000, 200), ('Băng gạc y tế vô trùng', 'Urgostérile', 12000, 400),
      ('Thuốc nhỏ mắt V.Rohto', 'Rohto', 55000, 300), ('Nhiệt kế điện tử hồng ngoại', 'Microlife', 550000, 80);`);
  } catch (err) { setTimeout(initDB, 4000); }
}
initDB();
app.get('/api/products', async (req, res) => { requestCount++; res.json((await pool.query('SELECT * FROM products ORDER BY id ASC')).rows); });
app.get('/api/products/:id', async (req, res) => { requestCount++; const r = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]); res.json(r.rows[0] || {}); });
app.get('/health', (req, res) => res.send('OK')); app.get('/metrics', (req, res) => res.send(`http_requests_total{service="catalog-service"} ${requestCount}\n`));
app.listen(3002, () => console.log('Catalog v2 port 3002'));
