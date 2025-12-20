import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDn1r0J6m59WkETDRXxw4mFIeoPsZy8n8w",
  authDomain: "somalux-eb820.firebaseapp.com",
  projectId: "somalux-eb820",
  storageBucket: "somalux-eb820.firebasestorage.app",
  messagingSenderId: "1087160446048",
  appId: "1:1087160446048:web:e422cdc9f18ce5d5c3e705",
  measurementId: "G-VTDGJHPFFW"
};

// ✅ Initialize Firebase only once
const app = initializeApp(firebaseConfig);

// ✅ Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const messaging = getMessaging(app);
export const storage = getStorage(app);
