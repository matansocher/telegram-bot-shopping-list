const firebaseService = require('../firebase/firebase.service');
const telegramService = require('../telegram/telegram.service');

async function menuHandler(bot, { chatId }) {
    const menuItems = [
        'list - get all future reminders',
        'clear - clear all future reminders',
        'add - new reminder: `${num}${units - m|h|d} - ${reminder text}`'
    ];
    const responseText = `Here are the options I can help with\n\n${menuItems.join('\n')}`;
    await bot.sendMessage(chatId, responseText);
}

async function addHandler(bot, { chatId, actionText, date }) {
    const { remindAtSymbol, reminderText } = telegramService.parseNewReminderText(actionText);
    const { remindAtAmount, remindAtUnits } = telegramService.parseTimeToRemindText(remindAtSymbol);
    const remindAt = telegramService.getRemindAt(date, remindAtAmount, remindAtUnits);
    await firebaseService.addReminderItem(chatId.toString(), { text: reminderText, date, remindAt, hasNotified: false });

    const addReminderSuccessMessageText = telegramService.getAddReminderSuccessMessageText(reminderText, remindAtAmount, remindAtUnits);
    await bot.sendMessage(chatId, addReminderSuccessMessageText);
}

async function listHandler(bot, { chatId }) {
    let remindersItems = await firebaseService.getActiveReminders(chatId.toString());
    remindersItems = remindersItems.filter(remindersItem => !remindersItem.isDailyAlert);

    const remindersItemsText = remindersItems.map(remindersItem => `${remindersItem.text} - ${remindersItem.dateFormat}`)
    const responseText = remindersItemsText && remindersItemsText.length ?
        `Here is the shopping list:\n\n${remindersItemsText.join('\n')}` :
        `The list is currently empty`;
    await bot.sendMessage(chatId, responseText);
}

async function clearHandler(bot, { chatId }) {
    await firebaseService.clearReminders(chatId.toString());
    await bot.sendMessage(chatId, `OK, the reminders list is empty now`);
}

async function callbackQueryHandler(bot, { text, chatId, action, date }) {
    const [leftSide, rightSide] = action.split('_');

    if (leftSide === 'dailyAlertsAnswer') {
        const answer = rightSide;
        if (answer === '1') {
            const dailyAlertsTimestamps = telegramService.getDailyAlertsTimestamps();
            dailyAlertsTimestamps.forEach(dailyAlertsTimestamp => {
                const text = `Please take a few seconds to get up, stretch and relax, it is very healthy!`;
                firebaseService.addReminderItem(chatId.toString(), { text, date, remindAt: dailyAlertsTimestamp, hasNotified: false, isDailyAlert: true });
            });
            return bot.sendMessage(chatId, `OK, daily alerts set for today`);
        } else {
            return bot.sendMessage(chatId, `OK, no daily alerts today, will ask again tomorrow 😁`);
        }
    } else if (leftSide === 'stopDailyAlerts') {
        await firebaseService.removeAllDailyAlerts(chatId.toString());
        return bot.sendMessage(chatId, `OK, daily alerts will stop for today`);
    } else {
        const completeOrSnoozeText = leftSide;
        const reminderId = rightSide;
        const availableCallbackActions = ['complete', '1m', '1h', '1d'];
        if (!availableCallbackActions.includes(completeOrSnoozeText)) {
            throw { message: 'action not recognized' };
        }

        if (completeOrSnoozeText === 'complete') {
            await firebaseService.deleteReminder(chatId.toString(), reminderId);
            return bot.sendMessage(chatId, `OK 😁`);
        }

        const { amount: snoozeMsAmount, text: snoozeMsText } = telegramService.getMsToAddByCallbackActions(completeOrSnoozeText);
        await firebaseService.snoozeReminderItem(chatId.toString(), reminderId, snoozeMsAmount);
        return bot.sendMessage(chatId, `OK, I will remind you about - ${text} - ${snoozeMsText}`);
    }
}

async function startHandler(bot, { chatId }) {
    await firebaseService.updateAlertsSubscriber(chatId.toString(), true);
    await bot.sendMessage(chatId, `OK, I will suggest my magic every work day now`);
}

async function stopHandler(bot, { chatId }) {
    await firebaseService.updateAlertsSubscriber(chatId.toString(), false);
    await firebaseService.removeAllDailyAlerts(chatId.toString());
    await bot.sendMessage(chatId, `OK, I will stop suggesting, but please keep doing it without me 😁`);
}

module.exports = {
    menuHandler,
    addHandler,
    listHandler,
    clearHandler,
    callbackQueryHandler,

    startHandler,
    stopHandler
}
