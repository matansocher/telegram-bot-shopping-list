const firebaseService = require('../firebase/firebase.service');
const telegramService = require('../telegram/telegram.service');

async function addHandler(bot, { chatId, actionText, date }) {
    const { remindAtSymbol, reminderText } = telegramService.parseNewReminderText(actionText);
    const { remindAtAmount, remindAtUnits } = telegramService.parseTimeToRemindText(remindAtSymbol);
    const remindAt = telegramService.getRemindAt(date, remindAtAmount, remindAtUnits);
    await firebaseService.addReminderItem(chatId.toString(), { text: reminderText, date, remindAt, hasNotified: false });

    const addReminderSuccessMessageText = telegramService.getAddReminderSuccessMessageText(reminderText, remindAtAmount, remindAtUnits);
    await bot.sendMessage(chatId, addReminderSuccessMessageText);
}

async function listHandler(bot, { chatId }) {
    const remindersItems = await firebaseService.getActiveReminders(chatId.toString());

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

async function callbackQueryHandler(bot, { text, chatId, action }) {
    text = text.replace('You asked me to remind about - ', '');
    const [completeOrSnoozeText, id] = action.split('_');
    if (completeOrSnoozeText === 'complete') {
        await firebaseService.deleteReminder(chatId.toString(), id);
        bot.sendMessage(chatId, `Great job completing ${text}!!`);
    } else if (completeOrSnoozeText === '1m') {
        const millisecondsToAdd = 1000 * 60;
        await firebaseService.snoozeReminderItem(chatId.toString().toString(), id, millisecondsToAdd);
        bot.sendMessage(chatId, `OK, I will remind you about - ${text} - in a minute`);
    } else if (completeOrSnoozeText === '1h') {
        const millisecondsToAdd = 1000 * 60 * 60;
        await firebaseService.snoozeReminderItem(chatId.toString(), id, millisecondsToAdd);
        bot.sendMessage(chatId, `OK, I will remind you about - ${text} - in an hour`);
    } else if (completeOrSnoozeText === '1d') {
        const millisecondsToAdd = 1000 * 60 * 60 * 24;
        await firebaseService.snoozeReminderItem(chatId.toString(), id, millisecondsToAdd);
        bot.sendMessage(chatId, `OK, I will remind you about - ${text} - tomorrow`);
    }
}

module.exports = {
    addHandler,
    listHandler,
    clearHandler,
    callbackQueryHandler
}
