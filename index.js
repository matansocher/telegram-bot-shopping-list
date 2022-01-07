
require('dotenv').config()
const express = require('express');
const CORS = require('./services/cors.service');
const app = express();

require('./services/shopping-list-bot/shopping-list-bot.js');
require('./services/reminders-bot/reminders-bot.js');

app.use(CORS);

app.get('/', (req, res, next) => {
  res.send('OK');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Telegram Bot', `:: listening on port ${port} :: http://localhost:${port}`);
});
