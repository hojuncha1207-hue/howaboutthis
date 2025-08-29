require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// public 폴더 안의 파일들을 웹사이트의 기본 파일로 제공
app.use(express.static('public'));

// 데이터베이스 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// API 1: 주문 생성
app.post('/api/orders', async (req, res) => {
  const { orderId, userId, cart, date, totalPrice } = req.body;
  const orderDetails = { cart, date, totalPrice };
  try {
    const query = 'INSERT INTO orders(order_id, user_id, order_details) VALUES($1, $2, $3) RETURNING *';
    const values = [orderId, userId, orderDetails];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('주문 저장 에러:', error);
    res.status(500).json({ error: '서버 에러' });
  }
});

// API 2: 주문 조회
app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('주문 조회 에러:', error);
    res.status(500).json({ error: '서버 에러' });
  }
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
