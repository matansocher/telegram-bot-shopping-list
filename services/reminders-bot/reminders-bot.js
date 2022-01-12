// /start will get every morning of weekday a suggestion to subscribe
// /stop will stop the subscription for the user
// on server load need to set up to suggest alerts for the day, in the morning for all subscriber users
// if user approves in a morning, and then gets alerts for the rest of the day - will be stored as regular reminders with new flag

// think about cleanup - every start of the day just clean all other alerts

const config = require('../../config');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(config.remindersBotApiToken, {polling: true});
const remindersBotHandlers = require('./reminders-bot.handler');
const telegramService = require('../telegram/telegram.service');
const BOT_NAME = config.REMINDERS_BOT_NAME;


// start handling the reminders
const remindersBotListener = require('./reminders-bot.listener');
remindersBotListener.startRegularRemindersInterval(bot);


// here the starter of timeout to check this morning subscribers
remindersBotListener.setTimeoutToSuggestDailyAlertsToSubscribers(bot);


// *********************************************alerts listeners******************************************
// bot.onText(/\/start/, async (msg, match) => {
//     const data = { message: msg, actionText: match };
//     await telegramService.messageMainHandler(BOT_NAME, bot, remindersBotHandlers.startHandler, data)
// });
//
// bot.onText(/\/stop/, async (msg, match) => {
//     const data = { message: msg, actionText: match };
//     await telegramService.messageMainHandler(BOT_NAME, bot, remindersBotHandlers.stopHandler, data)
// });


// *********************************************regular reminders listeners******************************************
bot.on('message', async msg => {
    const data = { message: msg, actionText: [null, msg.text] };
    const relevantHandler = getRelevantHandler(msg.text);
    await telegramService.messageMainHandler(BOT_NAME, bot, relevantHandler, data);

    function getRelevantHandler(messageText) {
        switch (messageText) {
            case 'menu': return remindersBotHandlers.menuHandler;
            case 'start': return remindersBotHandlers.startHandler;
            case 'stop': return remindersBotHandlers.stopHandler;
            case 'list': return remindersBotHandlers.listHandler;
            case 'clear': return remindersBotHandlers.clearHandler;
            default: return remindersBotHandlers.addHandler;
        }
    }
});

bot.on('callback_query', async callbackQuery => {
    const data = { message: callbackQuery.message, callbackQueryData: callbackQuery.data };
    data.message.text = data.message.text.replace('You asked me to remind about - ', '');
    // here we will need to check with what starts the id in order to know to what handler to send - the regular reminder or the descision to subscribe/unsubscribe to alerts
    await telegramService.messageMainHandler(BOT_NAME, bot, remindersBotHandlers.callbackQueryHandler, data)
});
