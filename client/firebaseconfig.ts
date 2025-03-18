import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA8n45X0kiYT9lh8p4PnbqAfn1FRNqTSd8",
  authDomain: "e-mart-app-42c98.firebaseapp.com",
  projectId: "e-mart-app-42c98",
  storageBucket: "e-mart-app-42c98.firebasestorage.app",
  messagingSenderId: "552886338071",
  appId: "1:552886338071:web:d748ae36228c55f5cc9252",
  measurementId: "G-49M3XLXCYC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.log('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support persistence
    console.log('Persistence not supported by browser');
  }
});

export { auth, db, storage };
