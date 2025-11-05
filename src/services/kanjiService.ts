// src/services/kanjiService.ts

import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  QueryDocumentSnapshot,
  // Importiamo gli strumenti per le query e le operazioni batch
  query,
  where,
  writeBatch
} from "firebase/firestore";

// --- TIPI AGGIORNATI ---

// Un Set
export type StudySet = {
  id: string;
  name: string;
};

// Un Kanji (ora con 'setId')
export type LibraryKanji = {
  id: string;
  char: string;
  reading: string;
  meaning: string;
  setId: string; // <-- La modifica chiave!
};

// Tipi per i nuovi documenti (senza ID)
export type NewStudySet = Omit<StudySet, 'id'>;
export type NewLibraryKanji = Omit<LibraryKanji, 'id'>;

// --- FUNZIONI PER I SET ---

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

/**
 * Elimina un Set E TUTTI i kanji al suo interno.
 */
export const deleteSet = async (setId: string): Promise<void> => {
  // 1. Trova tutti i kanji che appartengono a questo set
  const kanjiQuery = query(collection(db, 'kanji'), where('setId', '==', setId));
  const kanjiSnapshot = await getDocs(kanjiQuery);

  // 2. Inizia un'operazione "batch" (tutto o niente)
  const batch = writeBatch(db);

  // 3. Aggiungi ogni kanji trovato alla batch per l'eliminazione
  kanjiSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 4. Aggiungi il set stesso alla batch per l'eliminazione
  const setDoc = doc(db, 'studySets', setId);
  batch.delete(setDoc);

  // 5. Esegui tutte le eliminazioni in un colpo solo
  await batch.commit();
};


// --- FUNZIONI PER I KANJI (AGGIORNATE) ---

/**
 * Ottiene tutti i kanji che appartengono a UN set specifico.
 */
export const getKanjiForSet = async (setId: string): Promise<LibraryKanji[]> => {
  // Crea una query: cerca nella collezione 'kanji'
  // dove il campo 'setId' è uguale al 'setId' che abbiamo passato
  const q = query(collection(db, 'kanji'), where('setId', '==', setId));
  
  const kanjiSnapshot = await getDocs(q);
  
  const kanjiList = kanjiSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    ...doc.data(),
    id: doc.id
  } as LibraryKanji));
  
  return kanjiList;
};

/**
 * Aggiunge un nuovo kanji.
 * L'oggetto 'kanji' deve già contenere il 'setId'.
 */
export const addKanji = async (kanji: NewLibraryKanji): Promise<LibraryKanji> => {
  // 'kanji' è il nome della tua collezione per i kanji
  const kanjiCol = collection(db, 'kanji'); 
  const docRef = await addDoc(kanjiCol, kanji);
  return { ...kanji, id: docRef.id }; 
};

/**
 * Elimina un singolo kanji (es. quando l'utente clicca un cestino)
 */
export const deleteKanji = async (id: string): Promise<void> => {
  const kanjiDoc = doc(db, 'kanji', id);
  await deleteDoc(kanjiDoc);
};