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

const getDailyRecords = (date) => {
  const directoryPath = path.join(path.resolve(), "data", "timeblocks");
  const files = fs.readdirSync(directoryPath);
  let allRecords = [];

  files.forEach((file) => {
    if (file.includes(date)) {
      const filePath = path.join(directoryPath, file);
      const fileRecords = JSON.parse(fs.readFileSync(filePath, "utf8"));
      allRecords = allRecords.concat(fileRecords);
    }
  });

  return allRecords;
};

const formatLeaderboard = (records) => {
  let leaderboard = `\`\`\`이름 | 출근 시간 | 퇴근 시간 | 총 근무 시간\n--------------------------------------------------\n`;
  const userRecords = {};

  records.forEach((record) => {
    if (!userRecords[record.user_id]) {
      userRecords[record.user_id] = {
        username: record.username,
        출근: null,
        퇴근: null,
      };
    }
    if (record.action === "출근") {
      userRecords[record.user_id].출근 = new Date(record.timestamp);
    } else if (record.action === "퇴근") {
      userRecords[record.user_id].퇴근 = new Date(record.timestamp);
    }
  });

  const sortedRecords = Object.values(userRecords).sort((a, b) => {
    if (a.출근 && b.출근) {
      return a.출근 - b.출근;
    }
    return 0;
  });

  sortedRecords.forEach((record) => {
    const 출근시간 = record.출근
      ? `${record.출근.getHours()}시 ${record.출근.getMinutes()}분`
      : "-";
    const 퇴근시간 = record.퇴근
      ? `${record.퇴근.getHours()}시 ${record.퇴근.getMinutes()}분`
      : "-";
    const 근무시간 =
      record.출근 && record.퇴근
        ? `${Math.floor(
            (record.퇴근 - record.출근) / (1000 * 60 * 60)
          )}시간 ${Math.floor(
            ((record.퇴근 - record.출근) % (1000 * 60 * 60)) / (1000 * 60)
          )}분`
        : "-";
    leaderboard += `${record.username} | ${출근시간} | ${퇴근시간} | ${근무시간}\n`;
  });

  leaderboard += `\`\`\``;
  return leaderboard;
};

// 출근 시간 기록 엔드포인트
router.post("/record", (req, res) => {
  const { user_id, username, action } = req.body;
  const timestamp = new Date();
  const filePath = getFilePath(user_id);

  // 파일이 존재하면 기존 기록 불러오기
  let records = [];
  if (fs.existsSync(filePath)) {
    records = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if (action === "퇴근") {
    // 당일 출근 기록이 있는지 확인
    const workRecord = records.find((record) => record.action === "출근");
    if (!workRecord) {
      return res
        .status(400)
        .json({ message: `<@${user_id}>님은 아직 출근 기록이 없습니다.` });
    }
  }

  // 출근/퇴근 기록이 이미 있는지 확인
  const existingRecord = records.find((record) => record.action === action);
  if (existingRecord) {
    return res
      .status(400)
      .json({ message: `이미 ${action} 기록이 존재합니다.` });
  }

  // 새로운 기록 추가
  records.push({ user_id, username, action, timestamp });

  // 기록을 파일에 저장
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));

  // 당일 기록된 모든 명단 생성
  const date = new Date().toISOString().split("T")[0];
  const dailyRecords = getDailyRecords(date);
  const leaderboard = formatLeaderboard(dailyRecords);

  res.json({
    message: `${action} 기록 완료. ${username}님 ${
      timestamp.getMonth() + 1
    }월 ${timestamp.getDate()}일에 ${timestamp.getHours()}시 ${timestamp.getMinutes()}분에 ${action}하셨습니다.`,
    leaderboard,
    timestamp,
  });
});

// 근무 시간 조회 엔드포인트
router.get("/leaderboard", (req, res) => {
  const date = new Date().toISOString().split("T")[0];
  const dailyRecords = getDailyRecords(date);
  const leaderboard = formatLeaderboard(dailyRecords);
  res.json({ leaderboard });
});

module.exports = router;
