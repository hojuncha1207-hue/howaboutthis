const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Neon DB 연결 설정
// Render에 배포할 때는 환경변수로 설정하세요.
// '여기에_NEON_데이터베이스_연결_URL을_넣으세요' 부분을 실제 URL로 교체해야 합니다.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '여기에_NEON_데이터베이스_연결_URL을_넣으세요',
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

// API 1: 새 주문 정보 받아서 데이터베이스에 저장하기
app.post('/api/orders', async (req, res) => {
  const { orderId, userId, cart } = req.body;

  if (!orderId || !userId || !cart) {
    return res.status(400).json({ error: 'Missing required order data' });
  }

  try {
    const query = 'INSERT INTO orders(order_id, user_id, order_details) VALUES($1, $2, $3) RETURNING *';
    const values = [orderId, userId, cart];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API 2: 사용자 ID로 최신 주문 정보 조회하기
app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // 해당 사용자의 주문을 최신순으로 정렬해서 가장 위에 있는 1개만 가져온다.
    const query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1';
    const values = [userId];
    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'No orders found for this user' });
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
