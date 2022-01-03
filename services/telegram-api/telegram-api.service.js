const { get } = require('lodash');

function getDefaultValuesFromMessage(message, actionText = '', callbackQueryData = '') {
    return {
        chatId: get(message, 'chat.id', ''),
        messageId: get(message, 'message_id', ''),
        text: get(message, 'text', ''),
        date: get(message, 'date', ''),
        username: get(message, 'from.username', ''),
        actionText: get(actionText, '[1]', null),
        action: callbackQueryData
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

module.exports = {
    getDefaultValuesFromMessage,
    buildOptionsButtons
};
