// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// ⭐ 1. IMPORTA GETFIRESTORE
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0deMtV2CpYVzRrnA9hXmbdLs7t7NciiM",
  authDomain: "kanamate.firebaseapp.com",
  projectId: "kanamate",
  storageBucket: "kanamate.firebasestorage.app",
  messagingSenderId: "995286381047",
  appId: "1:995286381047:web:6d1fd272f557a7aa68fef2",
  measurementId: "G-YNV2CP7K1E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

// Questo risolverà l'errore in kanjiService.ts
export const db = getFirestore(app);