// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCe5XKEJffR77gEKc9i6mP_0v4eY9h_0Wg",
  authDomain: "paltechlives.firebaseapp.com",
  projectId: "paltechlives",
  storageBucket: "paltechlives.firebasestorage.app",
  messagingSenderId: "1002271743057",
  appId: "1:1002271743057:web:26e4051eff2023e09a2c70",
  measurementId: "G-S6JMFWHW80"
};
 
// Initialize Firebase (reuse existing app if already initialized)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const Auth = getAuth(app);
export const Provider = new GoogleAuthProvider();