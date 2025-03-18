import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8n45X0kiYT9lh8p4PnbqAfn1FRNqTSd8",
  authDomain: "e-mart-app-42c98.firebaseapp.com",
  projectId: "e-mart-app-42c98",
  storageBucket: "e-mart-app-42c98.firebasestorage.app",
  messagingSenderId: "552886338071",
  appId: "1:552886338071:web:d748ae36228c55f5cc9252",
  measurementId: "G-49M3XLXCYC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
