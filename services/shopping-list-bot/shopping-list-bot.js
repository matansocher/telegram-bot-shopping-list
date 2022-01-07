const config = require('../../config');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.shoppingListBotApiToken, {polling: true});
const shoppingListBotHandlers = require('./shopping-list-bot.handler');
const telegramService = require('../telegram/telegram.service');
const BOT_NAME = config.SHOPPING_LIST_BOT_NAME;

bot.onText(/\/menu/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramService.messageMainHandler(BOT_NAME, bot, shoppingListBotHandlers.menuHandler, data)
});

bot.onText(/\/add (.+)/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramService.messageMainHandler(BOT_NAME, bot, shoppingListBotHandlers.addHandler, data)
});

bot.onText(/\/remove (.+)/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramService.messageMainHandler(BOT_NAME, bot, shoppingListBotHandlers.removeHandler, data)
});

bot.onText(/\/clear/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramService.messageMainHandler(BOT_NAME, bot, shoppingListBotHandlers.clearHandler, data)
});

bot.onText(/\/list/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramService.messageMainHandler(BOT_NAME, bot, shoppingListBotHandlers.listHandler, data)
});


bot.onText(/\/photo (.+)/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramService.messageMainHandler(BOT_NAME, bot, shoppingListBotHandlers.photoHandler, data)
});

bot.on('callback_query', async callbackQuery => {
    const data = { message: callbackQuery.message, actionText: null, callbackQueryData: callbackQuery.data };
    await telegramService.messageMainHandler(BOT_NAME, bot, shoppingListBotHandlers.callbackQueryHandler, data)
});
