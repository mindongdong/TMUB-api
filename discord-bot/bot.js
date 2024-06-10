const axios = require("axios");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require("discord.js");
const { DISCORD_BOT_TOKEN } = require("./config");

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

const port = 3000;

const TOKEN = DISCORD_BOT_TOKEN;
const API_URL = `http://localhost:${port}/discord/record`;
const LEADERBOARD_URL = `http://localhost:${port}/discord/leaderboard`;

client.once("ready", () => {
  console.log("Discord bot is ready");
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
      const response = await axios.post(API_URL, {
        user_id: userId,
        username: username,
        action: action,
      });
      const timestamp = new Date(response.data.timestamp);
      const date = `${timestamp.getMonth() + 1}월 ${timestamp.getDate()}일`;
      const time = `${timestamp.getHours()}시 ${timestamp.getMinutes()}분`;
      const messageText = `<@${userId}>님 당일 ${time}에 ${action}하셨습니다.\n${response.data.leaderboard}`;
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
