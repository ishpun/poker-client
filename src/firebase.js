import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Same Firebase project as Rummy - fallback so Realtime DB works in deployed build when env vars are not set at build time
const FALLBACK_FIREBASE = {
  apiKey: "AIzaSyBvXnb6o1dUAK28pI1JOBFOGxLjc2xeT5I",
  authDomain: "upbeat-airfoil-421817.firebaseapp.com",
  databaseURL: "https://upbeat-airfoil-421817-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "upbeat-airfoil-421817",
  storageBucket: "upbeat-airfoil-421817.appspot.com",
  messagingSenderId: "497408832111",
  appId: "1:497408832111:web:34492903f8ac6df859d39a",
};

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || FALLBACK_FIREBASE.apiKey,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || FALLBACK_FIREBASE.authDomain,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || FALLBACK_FIREBASE.databaseURL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || FALLBACK_FIREBASE.projectId,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || FALLBACK_FIREBASE.storageBucket,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_FIREBASE.messagingSenderId,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || FALLBACK_FIREBASE.appId,
};

// Require at least databaseURL for Realtime Database; avoid initializing with missing config
const hasRequiredConfig = firebaseConfig.apiKey && firebaseConfig.databaseURL;
const app = hasRequiredConfig ? initializeApp(firebaseConfig) : null;
export const realTimeDB = app ? getDatabase(app) : null;
