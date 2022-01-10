const config = require('../../config');
const firebaseService = require('../firebase/firebase.service');
const telegramService = require('../telegram/telegram.service');
const BOT_NAME = config.REMINDERS_BOT_NAME;

async function startInterval(bot) {
    await getActiveRemindersAndHandle(bot)
    setTimeout(async () => {
        await startInterval(bot);
    }, config.POLLING_INTERVAL);
}

async function getActiveRemindersAndHandle(bot) {
    console.log(`starting reminders listener handler`);
    const chatIds = await firebaseService.getAllChatIds();

    const totalPages = Math.ceil(chatIds.length / config.NUM_OF_USERS_TO_HANDLE_BATCH);
    for (let i = 0; i < totalPages; i++) {
        const currentChatIds = chatIds.splice(0, config.NUM_OF_USERS_TO_HANDLE_BATCH);
        let currentReminders = await firebaseService.getActiveRemindersForChatIds(currentChatIds);
        const currentActiveReminders = currentReminders.filter(currentReminder => !currentReminder.hasNotified);
        if (!currentActiveReminders || !currentActiveReminders.length) {
            console.log(`finished reminders listener handler - no reminder to remind this time`);
            return;
        }
        currentReminders.forEach(currentReminder => handleReminder(bot, currentReminder));
    }
}

async function handleReminder(bot, currentReminder) {
    const { id, text, dateFormat, chatId, remindAt } = currentReminder;
    const logBody = `bot: ${BOT_NAME}, chatId: ${chatId}, reminderId: ${id}, reminder text: ${text}`;
    console.log(`${logBody} - start`);

    if (new Date().getTime() < remindAt) {
        console.log(`${logBody} - no need to notify yet - the time has not yet come`);
        return;
    }
    console.log(`${logBody} - sending a reminder`);
    const buttonsOptions = telegramService.buildOptionsButtons([
        { text: '🔔 1 minute', data: `1m_${id}` },
        { text: '🔔 1 hour', data: `1h_${id}` },
        { text: '🔔 1 day', data: `1d_${id}` },
        { text: '✅ Complete', data: `complete_${id}` }
    ], 3);
    const options = { reply_markup: { inline_keyboard: buttonsOptions } };
    await firebaseService.markReminderItemAsNotified(chatId.toString(), id);
    await bot.sendMessage(chatId, `You asked me to remind about - ${text}`, options);
    console.log(`${logBody} - reminder sent`);
}

module.exports = {
    startInterval
}
