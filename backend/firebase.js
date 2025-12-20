import admin from "firebase-admin";
import serviceAccount from "./paltechproject-firebase-adminsdk-fbsvc-bd9fcaae72.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
