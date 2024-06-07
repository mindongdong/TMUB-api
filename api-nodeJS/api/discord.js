const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const getFilePath = (user_id) => {
    const date = new Date().toISOString().split('T')[0];
    return path.join(path.resolve(), 'data', 'timeblocks', `${user_id}_${date}.json`);
};

// 출근 시간 기록 엔드포인트
router.post('/record', (req, res) => {
    const { user_id, action } = req.body;
    const timestamp = new Date();
    const filePath = getFilePath(user_id);

    // 파일이 존재하면 기존 기록 불러오기
    let records = [];
    if (fs.existsSync(filePath)) {
        records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // 새로운 기록 추가
    records.push({ user_id, action, timestamp });

    // 기록을 파일에 저장
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2));

    res.json({ message: `${action} 기록 완료`, timestamp });
});

// 출퇴근 시간 조회 엔드포인트
router.get('/records', (req, res) => {
    const { user_id } = req.query;
    const filePath = getFilePath(user_id);

    if (fs.existsSync(filePath)) {
        const records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json({ records });
    } else {
        res.json({ records: [] });
    }
});

module.exports = router;