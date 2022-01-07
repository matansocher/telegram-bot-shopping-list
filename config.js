
module.exports = {
  shoppingListBotApiToken: process.env.SHOPPING_LIST_BOT_API_TOKEN,
  remindersBotApiToken: process.env.REMINDERS_BOT_API_TOKEN,

  firebaseConfig: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: 'telegram-api-b081e.firebaseapp.com',
    projectId: 'telegram-api-b081e',
    storageBucket: 'telegram-api-b081e.appspot.com',
    messagingSenderId: '790642253294',
    appId: '1:790642253294:web:68d1df66985696b19c82ff'
  },

  SHOPPING_LIST_BOT_NAME: 'Shopping List',
  REMINDERS_BOT_NAME: 'Reminders',

  POLLING_INTERVAL: 1000 * 60,
  NUM_OF_USERS_TO_HANDLE_BATCH: 5
};
