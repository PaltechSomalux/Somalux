import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA5vqja_7lqcT3w3P_WWxWSTixBlNdJ69g",
  authDomain: "paltechproject.firebaseapp.com",
  // Keep databaseURL only if you actually use Realtime Database; otherwise it can be omitted
  // databaseURL: "https://paltechproject-default-rtdb.firebaseio.com",
  projectId: "paltechproject",
  storageBucket: "paltechproject.firebasestorage.app",
  messagingSenderId: "465500897462",
  appId: "1:465500897462:web:cbc7be0860316e04ee2617",
  measurementId: "G-ERCCT8H1T1"
};

// ✅ Initialize Firebase only once
const app = initializeApp(firebaseConfig);

// ✅ Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const messaging = getMessaging(app);
export const storage = getStorage(app);
