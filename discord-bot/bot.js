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

client.once("ready", () => {
  console.log("Discord bot is ready");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!출근")) {
    const userId = message.author.id;
    const response = await axios.post(API_URL, {
      user_id: userId,
      action: "출근",
    });
    message.channel.send(response.data.message);
  } else if (message.content.startsWith("!퇴근")) {
    const userId = message.author.id;
    const response = await axios.post(API_URL, {
      user_id: userId,
      action: "퇴근",
    });
    message.channel.send(response.data.message);
  }
});

client.login(TOKEN);
