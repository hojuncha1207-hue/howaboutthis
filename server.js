const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// ✨ 1. JSON 데이터 처리 미들웨어 추가 ✨
// 프론트엔드에서 보낸 JSON 데이터를 서버가 이해할 수 있도록 해줍니다.
app.use(express.json());

// public 폴더의 정적 파일(index.html, css, js)을 제공합니다.
app.use(express.static(path.join(__dirname, 'public')));

// Render의 환경 변수(DATABASE_URL)를 사용합니다.
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
});


// ==========================================================
// ✨ 2. 주문 데이터를 받아 DB에 저장하는 API 추가 ✨
// ==========================================================
app.post('/api/order', async (req, res) => {
    // DB 클라이언트를 하나 빌려옵니다.
    const client = await pool.connect();
    
    try {
        // 프론트엔드에서 보낸 주문 데이터를 통째로 받습니다.
        const orderData = req.body;
        
        // --- 데이터베이스 트랜잭션 시작 ---
        // 주문 정보와 주문 상품 정보가 모두 성공적으로 저장되어야 하므로,
        // 중간에 하나라도 실패하면 모든 작업을 취소(ROLLBACK)하는 트랜잭션을 사용합니다.
        await client.query('BEGIN');

        // 1. orders 테이블에 주문 기본 정보 저장
        const orderInsertQuery = `
            INSERT INTO orders (order_id, user_id, store_id, total_price, order_date)
            VALUES ($1, $2, $3, $4, $5)
        `;
        // 참고: 현재 cart 구조상 store_id와 totalPrice를 한 번에 넣기 어려워,
        // 우선 첫 번째 가게 ID와 전체 가격으로 저장합니다. 
        // (추후 가게별로 주문을 분리하는 로직으로 개선할 수 있습니다.)
        const firstStoreId = Object.keys(orderData.cart)[0];

        await client.query(orderInsertQuery, [
            orderData.orderId,
            orderData.userId,
            firstStoreId, // 우선 대표 가게 ID를 저장
            orderData.totalPrice,
            orderData.date
        ]);

        // 2. order_items 테이블에 주문한 상품들 저장
        const itemInsertQuery = `
            INSERT INTO order_items (order_id, product_name, quantity, price)
            VALUES ($1, $2, $3, $4)
        `;

        // 장바구니에 있는 모든 가게의 모든 상품을 반복해서 저장합니다.
        for (const storeId in orderData.cart) {
            const store = orderData.cart[storeId];
            for (const cartItemId in store.items) {
                const item = store.items[cartItemId];
                await client.query(itemInsertQuery, [
                    orderData.orderId,
                    item.name,
                    item.quantity,
                    item.price
                ]);
            }
        }
        
        // --- 모든 작업이 성공했으므로 트랜잭션 완료 ---
        await client.query('COMMIT');
        
        // 프론트엔드에 성공 메시지 전송
        res.status(201).json({ message: 'Order successfully created' });

    } catch (error) {
        // --- 작업 중 하나라도 실패하면 모든 변경사항 취소 ---
        await client.query('ROLLBACK');
        
        console.error('DB 저장 오류:', error);
        res.status(500).json({ message: 'Failed to save order to database' });
    } finally {
        // --- 성공하든 실패하든, 빌려온 DB 클라이언트 반납 ---
        client.release();
    }
});


// Render의 PORT 환경 변수를 사용합니다.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT} 에서 실행 중입니다.`);
});
