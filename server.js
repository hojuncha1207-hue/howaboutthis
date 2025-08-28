// 필요한 라이브러리를 불러옵니다.
const express = require('express');
const path = require('path');

// Express 앱을 생성합니다.
const app = express();

// Render 같은 서비스에서 지정하는 PORT를 사용하거나, 없으면 3000번 포트를 사용합니다.
const PORT = process.env.PORT || 3000;

// 'public' 폴더에 있는 정적 파일들(html, css, js)을 사용하도록 설정합니다.
app.use(express.static(path.join(__dirname, 'public')));

// ===============================================
// ==     API 라우터 (미래의 서버 기능을 여기에 추가)     ==
// ===============================================
// 예시: /api/stores 요청이 오면 가게 목록을 JSON으로 응답
/*
app.get('/api/stores', (req, res) => {
  const storeData = [ { id: 1, name: "수희과일" }, { id: 2, name: "안동상회" } ];
  res.json(storeData);
});
*/

// 그 외 모든 요청은 그냥 index.html을 보여줍니다. (화면 깜빡임 없는 SPA 라우팅을 위함)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 지정된 포트에서 서버 실행을 시작합니다.
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
