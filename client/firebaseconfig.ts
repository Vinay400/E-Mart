import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Fallback values in case environment variables are not loaded
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA8n45X0kiYT9lh8p4PnbqAfn1FRNqTSd8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "e-mart-app-42c98.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "e-mart-app-42c98",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "e-mart-app-42c98.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "552886338071",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:552886338071:web:d748ae36228c55f5cc9252",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-49M3XLXCYC"
};

// Log configuration for debugging (remove in production)
console.log("Firebase config:", {
  apiKey: firebaseConfig.apiKey ? "***" : "missing",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? "***" : "missing",
  measurementId: firebaseConfig.measurementId
});

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
