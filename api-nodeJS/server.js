const express = require('express');
const cors = require('cors');

const todoRoutes = require('./api/todo');
const discordRoutes = require('./api/discord');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/todo', todoRoutes);
app.use('/discord', discordRoutes);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
