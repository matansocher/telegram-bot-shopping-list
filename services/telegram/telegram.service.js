const { get } = require('lodash');
const moment = require('moment');

async function messageMainHandler(botName, bot, handlerFunction, { message, actionText = '', callbackQueryData = '' }) {
    const defaultValuesFromMessage = getDefaultValuesFromMessage(message, actionText, callbackQueryData);

    const logBody = `bot: ${botName}, chatId: ${defaultValuesFromMessage.chatId}, username: ${defaultValuesFromMessage.username}, action: ${handlerFunction.name}`;
    console.log(`${logBody} - start`);

    try {
        // await bot.sendChatAction(defaultValuesFromMessage.chatId, 'typing');
        await handlerFunction(bot, defaultValuesFromMessage);
        console.log(`${logBody} - success`);
    } catch (err) {
        console.error(`${logBody} - error - ${JSON.stringify(err)}`);
        await bot.sendMessage(defaultValuesFromMessage.chatId, `Sorry, but something went wrong`)
    }
}

// timeToRemind should be something like 1m, 4d, 11h
function getDefaultValuesFromMessage(message, actionText = '', callbackQueryData = '', timeToRemind = '') {
    return {
        chatId: get(message, 'chat.id', ''),
        messageId: get(message, 'message_id', ''),
        text: get(message, 'text', ''),
        date: new Date().getTime(),
        username: get(message, 'from.username', ''),
        actionText: get(actionText, '[1]', null),
        action: callbackQueryData,
        timeToRemind
    };
}

function buildOptionsButtons(options, numOfButtonsInLine) {
    const finalResult = [];
    let currentArr = [];
    for (let i = 0; i < options.length; i++) {
        if (currentArr.length === numOfButtonsInLine) {
            finalResult.push(currentArr);
            currentArr = [];
        }
        const { text, data } = options[i];
        currentArr.push({ text, callback_data: data });
    }
    if (currentArr.length) {
        finalResult.push(currentArr);
    }
    return finalResult;
}

function parseNewReminderText(messageText) {
    try {
        const firstSpace = messageText.indexOf(' ');
        const remindAtSymbol = messageText.substring(0, firstSpace);
        const reminderText = messageText.substring(firstSpace + 1, messageText.length);
        return { remindAtSymbol, reminderText };
    } catch (err) {
        throw { message: 'could not parse new reminder text' }
    }
}

function parseTimeToRemindText(remindAtSymbol) {
    try {
        return {
            remindAtUnits: remindAtSymbol.substr(remindAtSymbol.length - 1),
            remindAtAmount: parseInt(remindAtSymbol.substring(0, remindAtSymbol.length - 1))
        }
    } catch (err) {
        throw { message: 'could not parse time to remind text' }
    }
}

function getRemindAt(date, remindAtAmount, remindAtUnits) {
    try {
        let numOfMillisecondsToAdd = remindAtAmount * getTimeToAddByUnits(remindAtUnits) * 1000;
        return date + numOfMillisecondsToAdd;
    } catch (err) {
        throw { message: 'could not get remind at time' }
    }

    function getTimeToAddByUnits(units) {
        switch (units) {
            case 'm': return 60;
            case 'h': return 60 * 60;
            case 'd': return 60 * 60 * 24;
            default: return 0;
        }
    }
}

function getAddReminderSuccessMessageText(reminderText, remindAtAmount, remindAtUnits) {
    const unitsStr = getUnitsStrByUnitsSymbol(remindAtUnits, remindAtAmount);
    return `OK, I will remind you to ${reminderText} in ${remindAtAmount} ${unitsStr}`;

    function getUnitsStrByUnitsSymbol(remindAtUnits, remindAtAmount) {
        switch (remindAtUnits) {
            case 'm': return remindAtAmount === 1 ? 'minute' : 'minutes';
            case 'h': return remindAtAmount === 1 ? 'hour' : 'hours';
            case 'd': return remindAtAmount === 1 ? 'day' : 'days';
            default: return 0;
        }
    }
}

function getReminderTextInList(reminder) {
    const { text, remindAt } = reminder;
    const dateObj = new Date(remindAt);
    const dateFormat = moment(dateObj.getTime()).fromNow();
    return { text, dateFormat };
}

function getMillisecondsToAddByCallbackActions(callbackActions) {
    switch (callbackActions) {
        case '1m': return { amount: 1000 * 60, text: 'in a minute' };
        case '1h': return { amount: 1000 * 60 * 60, text: 'in an hour' };
        case '1d': return { amount: 1000 * 60 * 60 * 24, text: 'tomorrow' };
    }
}

module.exports = {
    messageMainHandler,
    buildOptionsButtons,
    parseNewReminderText,
    parseTimeToRemindText,
    getRemindAt,
    getAddReminderSuccessMessageText,
    getReminderTextInList,
    getMillisecondsToAddByCallbackActions
};
