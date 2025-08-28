// 필요한 라이브러리를 불러옵니다.
const express = require('express');
const path = require('path');

// Express 앱을 생성합니다.
const app = express();
const PORT = process.env.PORT || 3000;

// POST 요청의 JSON 본문을 파싱하기 위한 미들웨어
app.use(express.json());

// 'public' 폴더에 있는 정적 파일들(html, css, js)을 사용하도록 설정합니다.
app.use(express.static(path.join(__dirname, 'public')));

// ===============================================
// ==     데이터베이스 역할 (현재는 임시 메모리)     ==
// ===============================================
// { "userId": [ { orderId: ..., cart: ... }, ... ] } 형태의 데이터 저장소
let ordersDatabase = {};


// ===============================================
// ==          API 라우터 (서버 기능)           ==
// ===============================================

/**
 * API: 새 주문 생성
 * POST /api/orders
 * 요청 본문(body): { userId: "입력한ID", cart: { ...장바구니 정보 } }
 */
app.post('/api/orders', (req, res) => {
  const { userId, cart } = req.body;

  if (!userId || !cart) {
    return res.status(400).json({ message: "userId와 cart 정보가 필요합니다." });
  }

  const newOrder = {
    orderId: `CNY-${Date.now()}`,
    date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
    cart: cart,
    totalPrice: Object.values(cart).reduce((sum, store) => {
        return sum + Object.values(store.items).reduce((storeSum, item) => storeSum + item.price * item.quantity, 0);
    }, 0)
  };

  // 해당 userId가 처음 주문하는 경우, 배열을 새로 만들어줍니다.
  if (!ordersDatabase[userId]) {
    ordersDatabase[userId] = [];
  }

  // 사용자의 주문 내역에 새 주문을 추가합니다.
  ordersDatabase[userId].unshift(newOrder); // unshift를 사용해 최신 주문이 맨 앞에 오도록 함

  console.log(`새 주문 접수:`, newOrder);
  res.status(201).json(newOrder); // 성공적으로 생성되었음을 알리고 새 주문 정보를 반환
});


/**
 * API: 특정 사용자의 주문 내역 조회
 * GET /api/orders/:userId
 * :userId는 URL 경로의 일부로 전달됩니다.
 */
app.get('/api/orders/:userId', (req, res) => {
  const { userId } = req.params; // URL 파라미터에서 userId를 가져옵니다.
  
  const userOrders = ordersDatabase[userId] || []; // 해당 ID의 주문이 없으면 빈 배열을 반환
  
  console.log(`'${userId}'님의 주문 내역 조회: ${userOrders.length}건`);
  res.json(userOrders);
});


// 그 외 모든 GET 요청은 그냥 index.html을 보여줍니다.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 지정된 포트에서 서버 실행을 시작합니다.
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
