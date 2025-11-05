// src/services/kanjiService.ts

import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  QueryDocumentSnapshot,
  query,
  where,
  writeBatch,
  // --- MODIFICA 1: Importa updateDoc ---
  updateDoc 
} from "firebase/firestore";

// --- TIPI (invariati) ---
export type StudySet = {
  id: string;
  name: string;
};

export type LibraryKanji = {
  id: string;
  char: string;
  reading: string;
  romaji: string;
  meaning: string;
  setId: string;
};

export type NewStudySet = Omit<StudySet, 'id'>;
export type NewLibraryKanji = Omit<LibraryKanji, 'id'>;


// --- FUNZIONI SET (invariate) ---

export const getStudySets = async (): Promise<StudySet[]> => {
  const setsCol = collection(db, 'studySets');
  const setsSnapshot = await getDocs(setsCol);
  const setsList = setsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    ...doc.data(),
    id: doc.id
  } as StudySet));
  return setsList;
};

export const addSet = async (set: NewStudySet): Promise<StudySet> => {
  const setsCol = collection(db, 'studySets');
  const docRef = await addDoc(setsCol, set);
  return { ...set, id: docRef.id };
};

export const deleteSet = async (setId: string): Promise<void> => {
  const kanjiQuery = query(collection(db, 'kanji'), where('setId', '==', setId));
  const kanjiSnapshot = await getDocs(kanjiQuery);
  const batch = writeBatch(db);
  kanjiSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  const setDoc = doc(db, 'studySets', setId);
  batch.delete(setDoc);
  await batch.commit();
};

// --- FUNZIONI KANJI ---

export const getKanjiForSet = async (setId: string): Promise<LibraryKanji[]> => {
  const q = query(collection(db, 'kanji'), where('setId', '==', setId));
  const kanjiSnapshot = await getDocs(q);
  const kanjiList = kanjiSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    ...doc.data(),
    id: doc.id
  } as LibraryKanji));
  return kanjiList;
};

export const addKanji = async (kanji: NewLibraryKanji): Promise<LibraryKanji> => {
  const kanjiCol = collection(db, 'kanji'); 
  const docRef = await addDoc(kanjiCol, kanji);
  return { ...kanji, id: docRef.id }; 
};

export const deleteKanji = async (id: string): Promise<void> => {
  const kanjiDoc = doc(db, 'kanji', id);
  await deleteDoc(kanjiDoc);
};

// --- MODIFICA 2: Aggiunta funzione 'updateKanji' ---
// Accetta un ID e un oggetto parziale di dati da aggiornare
export const updateKanji = async (id: string, data: Partial<LibraryKanji>): Promise<void> => {
  const kanjiDoc = doc(db, 'kanji', id);
  await updateDoc(kanjiDoc, data);
};