const config = require('../../config');
const firebaseService = require('../firebase/firebase.service');
const telegramService = require('../telegram/telegram.service');
const REMINDERS_BOT_NAME = `${config.REMINDERS_BOT_NAME}: reminders`;
const ALERTS_BOT_NAME = `${config.REMINDERS_BOT_NAME}: alerts`;

async function startRegularRemindersInterval(bot) {
    await getActiveRemindersAndHandle(bot)
    setTimeout(async () => {
        await startRegularRemindersInterval(bot);
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
    const { id: reminderId, text, dateFormat, chatId, remindAt, isDailyAlert } = currentReminder;
    const logBody = `bot: ${REMINDERS_BOT_NAME}, chatId: ${chatId}, reminderId: ${reminderId}, reminder text: ${text}`;
    console.log(`${logBody} - start`);

    if (new Date().getTime() < remindAt) {
        console.log(`${logBody} - no need to notify yet - the time has not yet come`);
        return;
    }
    console.log(`${logBody} - sending a reminder`);
    const buttonsOptions = [
        { text: '🔔 1 minute', data: `1m_${reminderId}` },
        { text: '🔔 1 hour', data: `1h_${reminderId}` },
        { text: '🔔 1 day', data: `1d_${reminderId}` },
        { text: '✅ Complete', data: `complete_${reminderId}` }
    ];
    if (isDailyAlert) {
        buttonsOptions.push({ text: '🛑 Stop', data: `stopDailyAlerts_${reminderId}` });
    }
    const finalButtonsOptions = telegramService.buildOptionsButtons(buttonsOptions, 3);
    const options = { reply_markup: { inline_keyboard: finalButtonsOptions } };
    await firebaseService.markReminderItemAsNotified(chatId.toString(), reminderId);
    await bot.sendMessage(chatId, `You asked me to remind about - ${text}`, options);
    console.log(`${logBody} - reminder sent`);
}

async function setTimeoutToSuggestDailyAlertsToSubscribers(bot) {
    const timeToWakeUpAndSuggestDailyAlerts = telegramService.getNextTimeToSuggestDailyAlerts();
    setTimeout(async () => {
        await cleanOldDailyAlerts(); // clean old daily alerts
        await suggestDailyAlertsToSubscribers(bot); // send a suggestion in the morning
        setTimeoutToSuggestDailyAlertsToSubscribers(bot);
    }, timeToWakeUpAndSuggestDailyAlerts - new Date().getTime());
}

async function cleanOldDailyAlerts() {
    const chatIdsSubscribedToAlerts = await firebaseService.getAllChatIdsSubscribedToAlerts();

    const totalPages = Math.ceil(chatIdsSubscribedToAlerts.length / config.NUM_OF_USERS_TO_HANDLE_BATCH);
    for (let i = 0; i < totalPages; i++) {
        const currentChatIds = chatIdsSubscribedToAlerts.splice(0, config.NUM_OF_USERS_TO_HANDLE_BATCH);
        currentChatIds.forEach(currentChatId => firebaseService.removeAllDailyAlerts(currentChatId.toString()));
    }
}

async function suggestDailyAlertsToSubscribers(bot) {
    console.log(`starting suggestion to subscribed users to alerts`);
    const chatIdsSubscribedToAlerts = await firebaseService.getAllChatIdsSubscribedToAlerts();

    const totalPages = Math.ceil(chatIdsSubscribedToAlerts.length / config.NUM_OF_USERS_TO_HANDLE_BATCH);
    for (let i = 0; i < totalPages; i++) {
        const currentChatIds = chatIdsSubscribedToAlerts.splice(0, config.NUM_OF_USERS_TO_HANDLE_BATCH);
        currentChatIds.forEach(currentChatId => handleDailyAlertsSuggestion(bot, currentChatId));
    }
}

async function handleDailyAlertsSuggestion(bot, chatId) {
    const logBody = `bot: ${ALERTS_BOT_NAME}, chatId: ${chatId}`;
    console.log(`${logBody} - start sending a daily alerts suggestion`);

    const buttonsOptions = telegramService.buildOptionsButtons([
        { text: '✅ Yes', data: `dailyAlertsAnswer_1` },
        { text: '🛑 No', data: `dailyAlertsAnswer_0` }
    ], 2);
    const options = { reply_markup: { inline_keyboard: buttonsOptions } };
    await bot.sendMessage(chatId, `Would you like to receive my alerts today?`, options);

    console.log(`${logBody} - daily alerts suggestion sent`);
}

module.exports = {
    startRegularRemindersInterval,
    setTimeoutToSuggestDailyAlertsToSubscribers
}
