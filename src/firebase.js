import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyBvXnb6o1dUAK28pI1JOBFOGxLjc2xeT5I",
  authDomain: "upbeat-airfoil-421817.firebaseapp.com",
  databaseURL: "https://upbeat-airfoil-421817-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "upbeat-airfoil-421817",
  storageBucket: "upbeat-airfoil-421817.appspot.com",
  messagingSenderId: "497408832111",
  appId: "1:497408832111:web:34492903f8ac6df859d39a"
};

const app = initializeApp(firebaseConfig);
export const realTimeDB = getDatabase(app); 
