// server.js

// 1. 라이브러리 불러오기
require('dotenv').config(); // .env 파일의 환경변수를 불러옴
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // PostgreSQL 라이브러리

// 2. Express 앱 설정
const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // CORS 허용 (다른 주소의 프론트엔드와 통신하기 위함)
app.use(express.json()); // 요청의 body(본문)를 JSON으로 파싱
app.use(express.static('public')); // 'public' 폴더의 정적 파일(html, css, js)을 제공

// 3. 데이터베이스 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// 4. API 엔드포인트(서버의 기능) 정의
// [API 1] 주문 생성 (프론트엔드 -> 서버)
app.post('/api/orders', async (req, res) => {
  const { orderId, userId, cart, date, totalPrice } = req.body;

  // 유효성 검사
  if (!orderId || !userId || !cart) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }

  const orderDetails = { cart, date, totalPrice };

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

// [API 2] 특정 사용자의 주문 조회 (서버 -> 프론트엔드)
app.get('/api/orders/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const query = 'SELECT order_id, user_id, order_details FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
    const values = [userId];
    const result = await pool.query(query, values);
    res.status(200).json(result.rows); // 조회된 주문 목록 반환
  } catch (error) {
    console.error('주문 조회 중 에러 발생:', error);
    res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
});

// 5. 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port 에서 실행 중입니다.`);
});