// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Le tue credenziali dal pannello Firebase
// (Per sicurezza, è meglio metterle in un file .env)
const firebaseConfig = {
  apiKey: "AIzaSyBl8eh2soUYPYu5UQgexFo1nCrtXKiCFyA",
  authDomain: "kanadev-9c6f5.firebaseapp.com",
  projectId: "kanadev-9c6f5",
  storageBucket: "kanadev-9c6f5.firebasestorage.app",
  messagingSenderId: "827378230789",
  appId: "1:827378230789:web:a8d20ec072211b3bcbde6c"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta il database Firestore per usarlo in altri file
export const db = getFirestore(app);