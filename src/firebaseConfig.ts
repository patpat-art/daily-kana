// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Le tue credenziali dal pannello Firebase
// (Per sicurezza, è meglio metterle in un file .env)
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tuo-progetto.firebaseapp.com",
  projectId: "tuo-progetto",
  storageBucket: "tuo-progetto.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta il database Firestore per usarlo in altri file
export const db = getFirestore(app);