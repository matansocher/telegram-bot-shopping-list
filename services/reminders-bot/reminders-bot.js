const config = require('../../config');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.remindersBotApiToken, {polling: true});
const remindersBotHandlers = require('./reminders-bot.handler');
const telegramService = require('../telegram/telegram.service');
const BOT_NAME = config.REMINDERS_BOT_NAME;


// start handling the reminders
const remindersBotListener = require('./reminders-bot.listener');
remindersBotListener.startInterval(bot);

bot.on('message', async msg => {
    const data = { message: msg, actionText: [null, msg.text] };
    let relevantHandler;
    switch (msg.text) {
        case 'menu': relevantHandler = remindersBotHandlers.menuHandler; break;
        case 'list': relevantHandler = remindersBotHandlers.listHandler; break;
        case 'clear': relevantHandler = remindersBotHandlers.clearHandler; break;
        default: relevantHandler = remindersBotHandlers.addHandler; break;
    }
    await telegramService.messageMainHandler(BOT_NAME, bot, relevantHandler, data);
});

bot.on('callback_query', async callbackQuery => {
    const data = { message: callbackQuery.message, callbackQueryData: callbackQuery.data };
    await telegramService.messageMainHandler(BOT_NAME, bot, remindersBotHandlers.callbackQueryHandler, data)
});
