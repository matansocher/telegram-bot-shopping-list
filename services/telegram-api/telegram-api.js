const config = require('../../config');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.telegramApiToken, {polling: true});
const telegramApiHandlers = require('./telegram-api-handlers');

bot.onText(/\/menu/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramApiHandlers.handler(bot, telegramApiHandlers.menuHandler, data)
});

bot.onText(/\/add (.+)/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramApiHandlers.handler(bot, telegramApiHandlers.addHandler, data)
});

bot.onText(/\/remove (.+)/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramApiHandlers.handler(bot, telegramApiHandlers.removeHandler, data)
});

bot.onText(/\/clear/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramApiHandlers.handler(bot, telegramApiHandlers.clearHandler, data)
});

bot.onText(/\/list/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramApiHandlers.handler(bot, telegramApiHandlers.listHandler, data)
});


bot.onText(/\/photo (.+)/, async (msg, match) => {
    const data = { message: msg, actionText: match };
    await telegramApiHandlers.handler(bot, telegramApiHandlers.photoHandler, data)
});

bot.on('callback_query', async callbackQuery => {
    const data = { message: callbackQuery.message, actionText: null, callbackQueryData: callbackQuery.data };
    await telegramApiHandlers.handler(bot, telegramApiHandlers.callbackQueryHandler, data)
});

// bot.on('message', async (msg) => {
//     const { chatId, messageId, text, actionText } = telegramApiService.getDefaultValuesFromMessage(msg);
//     // send a message to the chat acknowledging receipt of their message
//     bot.deleteMessage(chatId, messageId);
//     // await bot.sendMessage(chatId, 'Received your message');
//     console.log(``);
// });
