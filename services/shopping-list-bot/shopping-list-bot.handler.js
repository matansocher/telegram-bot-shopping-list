const firebaseService = require('../firebase/firebase.service');
const telegramService = require('../telegram/telegram.service');
const requestsService = require('../requests.service');

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
    await firebaseService.addShoppingListItem(chatId.toString(), { text: actionText, date });
    await bot.sendMessage(chatId, `OK, added ${actionText}`);
}

async function removeHandler(bot, { chatId, actionText }) {
    await firebaseService.removeShoppingListItem(chatId.toString(), actionText);
    await bot.sendMessage(chatId, `OK, removed ${actionText}`);
}

async function clearHandler(bot, { chatId }) {
    await firebaseService.clearShoppingList(chatId.toString());
    await bot.sendMessage(chatId, `OK, the shopping list is empty now`);
}

async function listHandler(bot, { chatId }) {
    const resp = await firebaseService.getShoppingList(chatId.toString());
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

    const buttonsOptions = telegramService.buildOptionsButtons([
        { text: 'Channel 1', data: 'click1' },
        { text: 'Channel 2', data: 'click2' },
        { text: 'Channel 3', data: 'click3' },
        { text: 'Channel 4', data: 'click4' }
    ], 2);
    const options = { reply_markup: { inline_keyboard: buttonsOptions } };
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
    menuHandler,
    addHandler,
    removeHandler,
    clearHandler,
    listHandler,
    photoHandler,
    callbackQueryHandler
}
