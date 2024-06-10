const axios = require("axios");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require("discord.js");
const cron = require("node-cron");
const TOKEN = process.env.DISCORD_BOT_TOKEN;

// Discord 봇 설정
const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

const API_URL = process.env.API_URL || "http://localhost:3333";

const RECORD_URL = `${API_URL}/discord/record`;
const LEADERBOARD_URL = `${API_URL}/discord/leaderboard`;

client.once("ready", () => {
  console.log("Discord bot is ready");

  // 10시와 18시에 메시지를 보내는 작업 예약
  cron.schedule(
    "0 10 * * *",
    () => {
      const channel = client.channels.cache.find(
        (channel) => channel.name === "출퇴근"
      );
      if (channel) {
        channel.send("좋은 아침입니다! 출근 시, `!출근` 명령어를 입력하시기 바랍니다.");
      }
    },
    {
      timezone: "Asia/Seoul",
    }
  );

  cron.schedule(
    "0 18 * * *",
    () => {
      const channel = client.channels.cache.find(
        (channel) => channel.name === "출퇴근"
      );
      if (channel) {
        channel.send("퇴근 시간이 다가왔습니다! 퇴근 시, `!퇴근` 명령어를 입력해주세요.");
      }
    },
    {
      timezone: "Asia/Seoul",
    }
  );
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const action = message.content.startsWith("!출근")
    ? "출근"
    : message.content.startsWith("!퇴근")
    ? "퇴근"
    : null;
  if (action) {
    const userId = message.author.id;
    const username = message.author.username;
    try {
      const response = await axios.post(RECORD_URL, {
        user_id: userId,
        username: username,
        action: action,
      });
      const timestamp = new Date(response.data.timestamp);
      const date = `${timestamp.getMonth() + 1}월 ${timestamp.getDate()}일`;
      const time = `${timestamp.getHours()}시 ${timestamp.getMinutes()}분`;
      const messageText = `<@${userId}>님 ${date} ${time}에 ${action}하셨습니다.\n${response.data.leaderboard}`;
      message.channel.send(messageText);
    } catch (error) {
      message.channel.send(error.response.data.message);
    }
  } else if (message.content.startsWith("!조회")) {
    try {
      const response = await axios.get(LEADERBOARD_URL);
      message.channel.send(response.data.leaderboard);
    } catch (error) {
      message.channel.send(`리더보드 조회에 실패했습니다: ${error.message}`);
    }
  } else if (message.content.startsWith("!help")) {
    const helpMessage = `
\`\`\`
사용 가능한 명령어:
1. !출근 - 출근 시간을 기록합니다.
2. !퇴근 - 퇴근 시간을 기록합니다. (출근 기록이 없는 경우, 오류 메시지를 출력합니다)
3. !조회 - 당일 근무 시간 및 기록된 출퇴근 시간을 조회합니다.
4. !help - 사용 가능한 명령어를 보여줍니다.
\`\`\`
    `;
    message.channel.send(helpMessage);
  }
});

client.login(TOKEN);
