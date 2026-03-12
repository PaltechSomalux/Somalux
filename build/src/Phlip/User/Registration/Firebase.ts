// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzcf397_h5WxYqa6Duenz7E2h5agntioE",
  authDomain: "paltech-elib.firebaseapp.com",
  projectId: "paltech-elib",
  storageBucket: "paltech-elib.firebasestorage.app",
  messagingSenderId: "1010376294730",
  appId: "1:1010376294730:web:83100779d5491bfe9101b3",
  measurementId: "G-HF7KY1GBVM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth=getAuth(app);  
export const provider =new GoogleAuthProvider();