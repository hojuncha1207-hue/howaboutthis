// server.js 최종본

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// POST 요청의 본문 크기 제한을 늘립니다. (QR코드 Data URL은 용량이 클 수 있음)
app.use(express.json({ limit: '5mb' }));

// 'public' 폴더에 있는 정적 파일들(html, css, js)을 사용하도록 설정합니다.
app.use(express.static(path.join(__dirname, 'public')));

// 데이터베이스 역할 (임시 메모리)
// { "userId": [ { orderId: ..., cart: ..., qrCodeDataUrl: "data:image/png;base64,..." }, ... ] }
let ordersDatabase = {};


// API: 새 주문 생성 (QR코드 포함)
app.post('/api/orders', (req, res) => {
  const { userId, cart, qrCodeDataUrl, orderId } = req.body;

  if (!userId || !cart || !qrCodeDataUrl || !orderId) {
    return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
  }

  const newOrder = {
    orderId: orderId,
    date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
    cart: cart,
    qrCodeDataUrl: qrCodeDataUrl, // 전달받은 QR코드 데이터 저장
    totalPrice: Object.values(cart).reduce((sum, store) => {
        return sum + Object.values(store.items).reduce((storeSum, item) => storeSum + item.price * item.quantity, 0);
    }, 0)
  };

  if (!ordersDatabase[userId]) {
    ordersDatabase[userId] = [];
  }
  ordersDatabase[userId].unshift(newOrder);

  console.log(`'${userId}'님의 새 주문 저장 (QR 포함)`);
  res.status(201).json(newOrder);
});

// API: 특정 사용자의 주문 내역 조회
app.get('/api/orders/:userId', (req, res) => {
  const { userId } = req.params;
  const userOrders = ordersDatabase[userId] || [];
  
  console.log(`'${userId}'님의 주문 내역 조회: ${userOrders.length}건`);
  res.json(userOrders);
});

// 그 외 모든 GET 요청은 index.html을 보여줌
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
