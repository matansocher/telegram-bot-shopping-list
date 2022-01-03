// const firebase = 'firebase';
const { database } = require('./firebase.config');

function getShoppingList(chatId) {
    chatId = chatId.toString();
    return database.collection('users').doc(chatId).collection('shoppingList').get();
    // return database.collection('users').doc(chatId.toString());
}

function addShoppingListItem(chatId, item) {
    chatId = chatId.toString();
    return database.collection('users').doc(chatId).collection('shoppingList').doc().set(item);
}

function getShoppingListItemByText(chatId, item) {
    chatId = chatId.toString();
    return database.collection('users').doc(chatId).collection('shoppingList').where('text', '==', item.text).get();
}

async function removeShoppingListItem(chatId, text) {
    chatId = chatId.toString();

    const resp = await getShoppingListItemByText(chatId, { text });
    const docsIds = resp.docs.map(item => item.id);

    const promisesArr = [];
    docsIds.forEach(docId => {
        database.collection('users').doc(chatId).collection('shoppingList').doc(docId).delete()
    });

    await Promise.all(promisesArr);
}

function clearShoppingList(chatId) {
    chatId = chatId.toString();
    return deleteCollection(`users/${chatId}/shoppingList`, 50);
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
    getShoppingList,
    addShoppingListItem,
    getShoppingListItemByText,
    removeShoppingListItem,
    clearShoppingList
}
