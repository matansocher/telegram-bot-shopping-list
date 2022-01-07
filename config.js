
module.exports = {
  shoppingListBotApiToken: process.env.SHOPPING_LIST_BOT_API_TOKEN,
  remindersBotApiToken: process.env.REMINDERS_BOT_API_TOKEN,

  SHOPPING_LIST_BOT_NAME: 'Shopping List',
  REMINDERS_BOT_NAME: 'Reminders',

  POLLING_INTERVAL: 1000 * 60,
  NUM_OF_USERS_TO_HANDLE_BATCH: 5
};
