
const express = require('express');
const CORS = require('./services/cors.service');
const app = express();

const routes = require('./routes');
require('./services/telegram-api/telegram-api.js');

app.use(CORS);

app.get('/', (req, res, next) => {
  res.send('OK');
});

app.use('/', routes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Telegram Bot', `:: listening on port ${port} :: http://localhost:${port}`);
});
