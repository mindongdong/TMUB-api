# api-nodeJS/Dockerfile

# Node.js 이미지 선택
FROM node:alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 서버 포트 노출
EXPOSE 3000

# 서버 시작 명령어
CMD ["node", "server.js"]
