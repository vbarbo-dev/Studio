import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5Fvf1n2BDE2fCTnH-Mn1RSRMDvvMC-6Y",
  authDomain: "zyndo-1321c.firebaseapp.com",
  projectId: "zyndo-1321c",
  storageBucket: "zyndo-1321c.firebasestorage.app",
  messagingSenderId: "1027537375908",
  appId: "1:1027537375908:web:e072497ba027c854be4c31",
  measurementId: "G-LVNG9YBHB1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.log('Firebase Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.log('Firebase Persistence not supported by browser');
    }
});