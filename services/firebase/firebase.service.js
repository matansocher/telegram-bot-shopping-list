const { flattenDeep } = require('lodash');
const { database } = require('./firebase.config');
const telegramService = require('../telegram/telegram.service');

async function getAllChatIds() {
    const resp = await database.collection('users').get();
    return resp.docs.map(item => item.id);
}

function getShoppingList(chatId) {
    return database.collection('users').doc(chatId).collection('shoppingList').get();
}

function addShoppingListItem(chatId, item) {
    return database.collection('users').doc(chatId).collection('shoppingList').doc().set(item);
}

function getShoppingListItemByText(chatId, item) {
    return database.collection('users').doc(chatId).collection('shoppingList').where('text', '==', item.text).get();
}

async function removeShoppingListItem(chatId, text) {

    const resp = await getShoppingListItemByText(chatId, { text });
    const docsIds = resp.docs.map(item => item.id);

    const promisesArr = [];
    docsIds.forEach(docId => {
        database.collection('users').doc(chatId).collection('shoppingList').doc(docId).delete()
    });

    await Promise.all(promisesArr);
}

function clearShoppingList(chatId) {
    return deleteCollection(`users/${chatId}/shoppingList`, 50);
}

async function getActiveReminders(chatId) {
    const resp = await database.collection('users').doc(chatId).collection('reminders')
        .where('hasNotified', '!=', true).get();
    return resp.docs
        .map(item => { return { id: item.id, ...item.data() } })
        .sort((item1, item2) => item1.remindAt > item2.remindAt ? 1 : -1)
        .map(item => {
            const { text, dateFormat } = telegramService.getReminderTextInList(item)
            return { ...item, id: item.id, text, dateFormat, chatId, remindAt: item.remindAt }
        });
}

async function getActiveRemindersForChatIds(chatIds) {
    let promisesArr = [];
    chatIds.forEach(chatId => {
        promisesArr.push(getActiveReminders(chatId));
    });
    const resp = await Promise.all(promisesArr);
    return flattenDeep(resp);
}

function addReminderItem(chatId, item) {
    return database.collection('users').doc(chatId).collection('reminders').doc().set(item);
}

function markReminderItemAsNotified(chatId, reminderId) {
    return database.collection('users').doc(chatId).collection('reminders').doc(reminderId).set({ hasNotified: true }, { merge: true });
}

function snoozeReminderItem(chatId, reminderId, msToAdd) {
    const newRemindAt = new Date().getTime() + msToAdd;
    return database.collection('users').doc(chatId).collection('reminders').doc(reminderId).set({ remindAt: newRemindAt, hasNotified: false }, { merge: true });
}

function deleteReminder(chatId, reminderId) {
    return database.collection('users').doc(chatId).collection('reminders').doc(reminderId).delete();
}

function clearReminders(chatId) {
    return deleteCollection(`users/${chatId}/reminders`, 50);
}


async function getAllChatIdsSubscribedToAlerts() {
    const resp = await database.collection('users').where('isSubscribedToAlerts', '==', true).get();
    return resp.docs.map(item => item.id);
}

function updateAlertsSubscriber(chatId, isSubscribedToAlerts) {
    return database.collection('users').doc(chatId).set({ isSubscribedToAlerts }, { merge: true })
}

async function removeAllDailyAlerts(chatId) {
    const resp = await database.collection('users').doc(chatId).collection('reminders').where('isDailyAlert', '==', true).get();
    const dailyAlertsIds = resp.docs.map(item => item.id);

    const promisesArr = [];
    dailyAlertsIds.forEach(dailyAlertsId => {
        promisesArr.push(deleteReminder(chatId, dailyAlertsId));
    });
    await Promise.all(promisesArr);
}

async function deleteCollection(collectionPath, batchSize) {
    const collectionRef = database.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) { // When there are no documents left, we are done
        resolve();
        return;
    }

    const batch = database.batch(); // Delete documents in a batch
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    process.nextTick(() => deleteQueryBatch(query, resolve)); // Recurse on the next process tick, to avoid exploding the stack.
}

module.exports = {
    getAllChatIds,
    getShoppingList,
    addShoppingListItem,
    getShoppingListItemByText,
    removeShoppingListItem,
    clearShoppingList,
    markReminderItemAsNotified,
    addReminderItem,
    snoozeReminderItem,
    deleteReminder,
    getActiveReminders,
    getActiveRemindersForChatIds,
    clearReminders,

    getAllChatIdsSubscribedToAlerts,
    updateAlertsSubscriber,
    removeAllDailyAlerts,
}
