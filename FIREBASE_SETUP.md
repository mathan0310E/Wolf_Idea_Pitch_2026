# Firebase Setup Guide — WOLF IDEATHON 2026

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project named `wolf-ideathon-2026`.
2. Register a Web App to get `apiKey`, `authDomain`, `projectId`, `storageBucket`, etc.

## 2. Enable Firebase Services
- **Authentication**: Enable Email/Password auth method.
- **Firestore Database**: Create database in production mode. Apply `firestore.rules`.
- **Storage**: Enable Storage bucket. Apply `storage.rules`.

## 3. Set Admin Custom Claim
Run Node script to set admin role:
```javascript
const admin = require('firebase-admin');
admin.initializeApp();
async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  console.log(`User ${uid} assigned admin role.`);
}
setAdmin('YOUR_ADMIN_FIREBASE_UID');
```
