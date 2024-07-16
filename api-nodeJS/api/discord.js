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

function convertToKST(timestamp) {
  const date = new Date(timestamp);
  // 한국 시간대로 변환 9시간 더하기
  date.setHours(date.getHours() + 9);
  return date.toISOString();
}

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

// 날짜별 모든 유저의 출퇴근 시간을 조회하는 엔드포인트
router.get("/all-records", (req, res) => {
  const directoryPath = path.join(path.resolve(), "data", "timeblocks");
  const files = fs.readdirSync(directoryPath);
  let allRecords = [];

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      if (fileContent) {
        const fileRecords = JSON.parse(fileContent);
        allRecords = allRecords.concat(fileRecords);
      }
    } catch (err) {
      console.error(`Error reading or parsing file ${filePath}:`, err);
    }
  });

  res.json(allRecords);
});

// 현재까지 출근 시간이 기록된 날짜들만을 조회하는 엔드포인트
router.get("/recorded-dates", (req, res) => {
  const directoryPath = path.join(path.resolve(), "data", "timeblocks");
  const files = fs.readdirSync(directoryPath);
  const recordedDates = files
    .map((file) => {
      const parts = file.split("_");
      if (parts.length > 1) {
        return parts[1].split(".")[0];
      } else {
        return null;
      }
    })
    .filter((date) => date !== null); // null 값을 필터링

  // 중복 제거 및 정렬
  const uniqueDates = [...new Set(recordedDates)].sort();

  res.json(uniqueDates);
});

// 현재까지 출퇴근 시간이 하루라도 기록된 유저 목록 조회하는 엔드포인트
router.get("/recorded-users", (req, res) => {
  const directoryPath = path.join(path.resolve(), "data", "timeblocks");
  const files = fs.readdirSync(directoryPath);
  let users = new Set();

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      if (fileContent) {
        const fileRecords = JSON.parse(fileContent);
        fileRecords.forEach((record) => {
          users.add(record.username);
        });
      }
    } catch (err) {
      console.error(`Error reading or parsing file ${filePath}:`, err);
    }
  });

  res.json(Array.from(users));
});

/// 특정 날짜 범위 안의 특정 유저의 출퇴근 시간을 조회하는 엔드포인트
router.get("/records-by-date", (req, res) => {
  const { startDate, endDate, username } = req.query;
  const directoryPath = path.join(path.resolve(), "data", "timeblocks");
  const files = fs.readdirSync(directoryPath);
  let allRecords = [];

  files.forEach((file) => {
    const parts = file.split("_");
    if (parts.length < 2) {
      console.error(`Invalid file name format: ${file}`);
      return;
    }

    const dateStr = parts[1].split(".")[0];
    if (!dateStr) {
      console.error(`Invalid date format in file name: ${file}`);
      return;
    }

    const date = new Date(dateStr);
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (date >= start && date <= end) {
      const filePath = path.join(directoryPath, file);
      try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        if (fileContent) {
          const fileRecords = JSON.parse(fileContent);
          const userRecords = fileRecords.filter(
            (record) => record.username === username
          );
          allRecords = allRecords.concat(userRecords);
        }
      } catch (err) {
        console.error(`Error reading or parsing file ${filePath}:`, err);
      }
    }
  });

  // 데이터를 원하는 형식으로 가공
  const events = [];
  const groupedRecords = {};

  allRecords.forEach((record) => {
    const date = record.timestamp.split("T")[0];
    if (!groupedRecords[date]) {
      groupedRecords[date] = { start: null, end: null };
    }
    if (record.action === "출근") {
      groupedRecords[date].start = convertToKST(record.timestamp);
    } else if (record.action === "퇴근") {
      groupedRecords[date].end = convertToKST(record.timestamp);
    }
  });

  for (const date in groupedRecords) {
    const { start, end } = groupedRecords[date];
    if (start && end) {
      events.push({
        start: start.replace("T", " ").substring(0, 16),
        end: end.replace("T", " ").substring(0, 16),
        title: "Working in the lab",
        class: "working hours",
      });
    }
  }

  res.json(events);
});

module.exports = router;
