const { get } = require('lodash');
const moment = require('moment');
const config = require('../../config');

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
        let numOfMsToAdd = remindAtAmount * getTimeToAddByUnits(remindAtUnits) * config.MS_IN_SECOND;
        return date + numOfMsToAdd;
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

function getMsToAddByCallbackActions(callbackActions) {
    switch (callbackActions) {
        case '1m': return { amount: config.MS_IN_MINUTE, text: 'in a minute' };
        case '1h': return { amount: config.MS_IN_HOUR, text: 'in an hour' };
        case '1d': return { amount: config.MS_IN_DAY, text: 'tomorrow' };
    }
}

function getNextTimeToSuggestDailyAlerts() {
    const remindAtHourOfDay = 10;
    const nowObj = new Date();
    const currentDayOnWeek = nowObj.getDay();
    const currentHours = nowObj.getHours();
    const currentMinutes = nowObj.getMinutes();
    const currentSeconds = nowObj.getSeconds();

    let daysToAdd = currentDayOnWeek === 4 ? 2 : (currentDayOnWeek === 5 ? 1 : 0);
    daysToAdd = currentHours > remindAtHourOfDay ? daysToAdd : daysToAdd + 1;
    const hoursToAdd = currentHours < remindAtHourOfDay ? (remindAtHourOfDay - currentHours - 1) : (24 - currentHours + remindAtHourOfDay - 1);
    const minutesToAdd = currentMinutes === 0 ? 60 : (60 - currentMinutes);

    return nowObj.getTime() + (config.MS_IN_DAY * daysToAdd) + (config.MS_IN_HOUR * hoursToAdd) + (config.MS_IN_MINUTE * minutesToAdd) - (config.MS_IN_SECOND * currentSeconds);
}

function getDailyAlertsTimestamps() {
    const dailyAlertsTimestamps = [];
    const nowObj = new Date();
    const limit = nowObj.getHours() > 10 ? 4 : 5;

    let currentTimestamp = nowObj.getTime();
    for (;;) {
        currentTimestamp = currentTimestamp + (config.MS_IN_HOUR * 1.5);
        dailyAlertsTimestamps.push(currentTimestamp);
        if (dailyAlertsTimestamps.length > limit - 1) {
            break;
        }
    }
    return dailyAlertsTimestamps;
}

module.exports = {
    messageMainHandler,
    buildOptionsButtons,
    parseNewReminderText,
    parseTimeToRemindText,
    getRemindAt,
    getAddReminderSuccessMessageText,
    getReminderTextInList,
    getMsToAddByCallbackActions,
    getNextTimeToSuggestDailyAlerts,
    getDailyAlertsTimestamps
};
