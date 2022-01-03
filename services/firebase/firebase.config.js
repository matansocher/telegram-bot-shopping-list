const config = require('../../config');
const firebase = require('firebase');

const app = firebase.initializeApp(config.firebaseConfig);

const database = app.firestore();

module.exports = { database };
