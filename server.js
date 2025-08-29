// 1. 필요한 부품들 가져오기
require('dotenv').config(); // .env 파일을 사용하기 위한 설정
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL 데이터베이스와 통신하기 위한 부품
const path = require('path');

// 2. 서버 기본 설정
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // 다른 주소에서의 요청을 허용 (보안)
app.use(express.json()); // JSON 형태의 데이터를 주고받을 수 있게 설정
app.use(express.static(path.join(__dirname, 'public'))); // public 폴더를 웹사이트의 기본 폴더로 설정

// 3. NEON 데이터베이스 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // DATABASE_URL은 나중에 호스팅 사이트에서 설정할 비밀키
  ssl: {
    rejectUnauthorized: false
  }
});

// 4. API (서버의 기능) 만들기

// 기능 1: 주문 받아서 데이터베이스에 저장하기
app.post('/api/orders', async (req, res) => {
  const { orderId, userId, cart, date, totalPrice } = req.body;
  const orderDetails = { cart, date, totalPrice };

  // 필수 정보가 있는지 확인
  if (!orderId || !userId || !cart) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }

  try {
    const query = 'INSERT INTO orders(order_id, user_id, order_details) VALUES($1, $2, $3) RETURNING *';
    const values = [orderId, userId, orderDetails];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]); // 성공적으로 생성됨
  } catch (error) {
    console.error('주문 저장 중 에러 발생:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

// 기능 2: 특정 사용자의 주문 내역을 데이터베이스에서 찾아서 보내주기
app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const query = 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    res.status(200).json(result.rows); // 조회된 주문 목록 반환
  } catch (error) {
    console.error('주문 조회 중 에러 발생:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

// 5. 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
