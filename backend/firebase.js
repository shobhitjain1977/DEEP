const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

if (!admin.getApps().length) {
  admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });
}

const db = getFirestore();
const messaging = getMessaging();

module.exports = { admin, db, messaging };