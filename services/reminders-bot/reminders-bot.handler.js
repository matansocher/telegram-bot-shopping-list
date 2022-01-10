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
    const [completeOrSnoozeText, id] = action.split('_');
    const availableCallbackActions = ['complete', '1m', '1h', '1d'];
    if (!availableCallbackActions.includes(completeOrSnoozeText)) {
        throw { message: 'action not recognized' };
    }

    if (completeOrSnoozeText === 'complete') {
        await firebaseService.deleteReminder(chatId.toString(), id);
        return bot.sendMessage(chatId, `Great job completing ${text}!!`);
    }

    const { amount: snoozeMillisecondsAmount, text: snoozeMillisecondsText } = telegramService.getMillisecondsToAddByCallbackActions(completeOrSnoozeText);
    await firebaseService.snoozeReminderItem(chatId.toString(), id, snoozeMillisecondsAmount);
    return bot.sendMessage(chatId, `OK, I will remind you about - ${text} - ${snoozeMillisecondsText}`);
}

module.exports = {
    menuHandler,
    addHandler,
    listHandler,
    clearHandler,
    callbackQueryHandler
}
