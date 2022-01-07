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
        return { remindAtSymbol: '99999d', reminderText: messageText };
    }
}

function parseTimeToRemindText(remindAtSymbol) {
    try {
        return {
            remindAtUnits: remindAtSymbol.substr(remindAtSymbol.length - 1),
            remindAtAmount: parseInt(remindAtSymbol.substring(0, remindAtSymbol.length - 1))
        }
    } catch (err) {
        throw {
            message: 'could not parse time to remind text'
        }
    }
}

function getRemindAt(date, remindAtAmount, remindAtUnits) {
    try {
        let numOfMillisecondsToAdd = remindAtAmount * getTimeToAddByUnits(remindAtUnits) * 1000;
        return date + numOfMillisecondsToAdd;
    } catch (err) {
        return date;
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
    const dateFormat = getFormattedDateFromDateObj(dateObj);
    return { text, dateFormat };
}

function getFormattedDateFromDateObj(dateObj) {
    return moment(dateObj.getTime()).fromNow();
    const differenceInDays = getDifferenceInDays(dateObj, new Date());
    if (differenceInDays < 1) {
        return `${numberAsTwoDigits(dateObj.getHours())}:${numberAsTwoDigits(dateObj.getMinutes())}`;
    }
    if (differenceInDays <= 2 && differenceInDays > 1) {
        return `tomorrow at ${numberAsTwoDigits(dateObj.getHours())}:${numberAsTwoDigits(dateObj.getMinutes())}`;
    }
    return `${numberAsTwoDigits(dateObj.getDate())}-${numberAsTwoDigits(dateObj.getMonth()+1)}-${numberAsTwoDigits(dateObj.getFullYear())}`
}

function getDifferenceInDays(dateObj1, dateObj2) {
    const differenceInTime = dateObj2.getTime() - dateObj1.getTime();
    return differenceInTime / (1000 * 3600 * 24);
}

function numberAsTwoDigits(number) {
    return number < 10 ? `0${number}` : number;
}

module.exports = {
    messageMainHandler,
    buildOptionsButtons,
    parseNewReminderText,
    parseTimeToRemindText,
    getRemindAt,
    getAddReminderSuccessMessageText,
    getReminderTextInList
};
