const config = require('../../config');

const firebaseService = require('../firebase/firebase.service');
const telegramApiService = require('./telegram-api.service');
const requestsService = require('../requests.service');


async function handler(bot, handlerFunction, { message, actionText = '', callbackQueryData = '' }) {
    const defaultValuesFromMessage = telegramApiService.getDefaultValuesFromMessage(message, actionText, callbackQueryData);

    const logBody = `chatId: ${defaultValuesFromMessage.chatId}, username: ${defaultValuesFromMessage.username}, action: ${handlerFunction.name}`;
    console.log(`${logBody} - start`);

    try {
        // await bot.sendChatAction(defaultValuesFromMessage.chatId, 'typing');
        await handlerFunction(bot, defaultValuesFromMessage)
        console.log(`${logBody} - success`);
    } catch (err) {
        console.error(`${logBody} - error - ${JSON.stringify(err)}`);
        // await bot.sendMessage(defaultValuesFromMessage.chatId, `Sorry, but something went wrong`)
    }
}

async function menuHandler(bot, { chatId }) {
    const menuItems = [
        '/add - add a new item - type /add and then the name of the item',
        '/remove - remove an item - type /remove and then the name of the item',
        '/list - get all items in the shopping list',
        '/clear - clear all items in the shopping list\n',
        '/photo - search random photo'
    ];
    const responseText = `Here are the options I can help with\n\n${menuItems.join('\n')}`;
    await bot.sendMessage(chatId, responseText);
}

async function addHandler(bot, { chatId, actionText, date }) {
    await firebaseService.addShoppingListItem(chatId, { text: actionText, date });
    await bot.sendMessage(chatId, `OK, added ${actionText}`);
}

async function removeHandler(bot, { chatId, actionText }) {
    await firebaseService.removeShoppingListItem(chatId, actionText);
    await bot.sendMessage(chatId, `OK, removed ${actionText}`);
}

async function clearHandler(bot, { chatId }) {
    await firebaseService.clearShoppingList(chatId);
    await bot.sendMessage(chatId, `OK, the list is empty now`);
}

async function listHandler(bot, { chatId }) {
    const resp = await firebaseService.getShoppingList(chatId);
    const shoppingListItems = resp.docs.map(item => item.data());
    const shoppingListItemNames = shoppingListItems
        .sort((item1, item2) => item1.date > item2.date ? 1 : -1)
        .map(shoppingListItem => shoppingListItem.text);

    const responseText = shoppingListItemNames && shoppingListItemNames.length ?
        `Here is the shopping list:\n\n${shoppingListItemNames.join('\n')}` :
        `The list is currently empty`;
    await bot.sendMessage(chatId, responseText);
}

async function photoHandler(bot, { chatId, actionText }) {
    const image = await requestsService.getPhotoByTitle(actionText);

    const buttonsOptions = telegramApiService.buildOptionsButtons([
        { text: 'Channel 1', data: 'click1' },
        { text: 'Channel 2', data: 'click2' },
        { text: 'Channel 3', data: 'click3' },
        { text: 'Channel 4', data: 'click4' }
    ], 2);
    const options = { 'reply_markup': { 'inline_keyboard': buttonsOptions } };
    await bot.sendPhoto(chatId, image, options);
}

async function callbackQueryHandler(bot, { chatId, action }) {
    // let text;
    // if (action === 'click1') {
    //     text = 'You hit button 1';
    // }
    bot.sendMessage(chatId, `callback_query - success - ${action}`);
}

module.exports = {
    handler,
    menuHandler,
    addHandler,
    removeHandler,
    clearHandler,
    listHandler,
    photoHandler,
    callbackQueryHandler
}
