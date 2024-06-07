const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const getFilePath = (user_id) => {
  const date = new Date().toISOString().split("T")[0];
  return path.join(
    path.resolve(),
    "data",
    "timeblocks",
    `${user_id}_${date}.json`
  );
};

const calculateWorkingTime = (records) => {
  const workRecord = records.find((record) => record.action === "출근");
  const leaveRecord = records.find((record) => record.action === "퇴근");
  let workingTime;

  if (workRecord && leaveRecord) {
    workingTime =
      new Date(leaveRecord.timestamp) - new Date(workRecord.timestamp);
  } else if (workRecord) {
    workingTime = new Date() - new Date(workRecord.timestamp);
  } else {
    workingTime = null;
  }

  return workingTime;
};

const formatWorkingTime = (workingTime) => {
  const hours = Math.floor(workingTime / (1000 * 60 * 60));
  const minutes = Math.floor((workingTime % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
};

// 출근 시간 기록 엔드포인트
router.post("/record", (req, res) => {
  const { user_id, action } = req.body;
  const timestamp = new Date();
  const filePath = getFilePath(user_id);

  // 파일이 존재하면 기존 기록 불러오기
  let records = [];
  if (fs.existsSync(filePath)) {
    records = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  // 출근/퇴근 기록이 이미 있는지 확인
  const existingRecord = records.find((record) => record.action === action);
  if (existingRecord) {
    return res
      .status(400)
      .json({ message: `이미 ${action} 기록이 존재합니다.` });
  }

  // 새로운 기록 추가
  records.push({ user_id, action, timestamp });

  // 기록을 파일에 저장
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));

  res.json({ message: `${action} 기록 완료`, timestamp });
});

// 근무 시간 조회 엔드포인트
router.get("/records", (req, res) => {
  const { user_id } = req.query;
  const filePath = getFilePath(user_id);

  if (fs.existsSync(filePath)) {
    const records = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const workingTime = calculateWorkingTime(records);
    let message;

    if (workingTime === null) {
      message = `<@${user_id}>님의 당일 출근 기록이 없습니다.`;
    } else {
      const { hours, minutes } = formatWorkingTime(workingTime);
      message = `<@${user_id}>님의 당일 근무 시간은 ${hours}시간 ${minutes}분 입니다.`;
    }

    res.json({ message });
  } else {
    res.json({ message: `<@${user_id}>님의 당일 출근 기록이 없습니다.` });
  }
});

module.exports = router;
