const firebase = require('firebase');

const app = firebase.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: 'telegram-api-b081e.firebaseapp.com',
    projectId: 'telegram-api-b081e',
    storageBucket: 'telegram-api-b081e.appspot.com',
    messagingSenderId: '790642253294',
    appId: '1:790642253294:web:68d1df66985696b19c82ff'
});

const database = app.firestore();

module.exports = { database };
