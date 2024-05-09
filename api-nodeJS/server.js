import express from 'express';
import cors from 'cors';
import todoRoutes from './api/todo.js';  // todo.js 모듈 경로에 맞게 조정하세요.

const app = express();
const port = 3000;

app.use(cors()); // CORS 미들웨어 활성화: 모든 도메인의 클라이언트 요청을 허용
app.use(express.json()); // JSON 요청 본문을 파싱하기 위한 미들웨어
app.use('/todo', todoRoutes); // API 라우트

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
