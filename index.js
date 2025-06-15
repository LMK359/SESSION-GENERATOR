const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;

// Load Firebase config
const serviceAccount = require('./firebase-config.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://lmkpairsite.firebaseio.com"
});

const db = admin.firestore();

// Test route
app.get('/', async (req, res) => {
  await db.collection('sessions').add({ created: new Date().toISOString() });
  res.send('✅ Session created and stored in Firestore!');
});

app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
