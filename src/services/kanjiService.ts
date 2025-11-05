import { db } from '../firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  QueryDocumentSnapshot,
  // Importa 'updateDoc' e 'arrayUnion'/'arrayRemove' che ci serviranno
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

// --- MODIFICA 1: Definiamo i tipi QUI e li ESPORTIAMO ---

// Tipo per un Kanji ESISTENTE (ha sempre un ID)
export type LibraryKanji = {
  id: string;
  char: string;
  reading: string;
  meaning: string;
  sets: string[]; // Array di ID dei set
};

// Tipo per un Set ESISTENTE (ha sempre un ID)
export type StudySet = {
  id: string;
  name: string;
};

// Tipo per un NUOVO Kanji (usiamo Omit per creare un tipo senza 'id')
export type NewLibraryKanji = Omit<LibraryKanji, 'id'>;

// Tipo per un NUOVO Set
export type NewStudySet = Omit<StudySet, 'id'>;


// --- FUNZIONI PER I KANJI ---

export const getKanjiLibrary = async (): Promise<LibraryKanji[]> => {
  const kanjiCol = collection(db, 'kanjiLibrary');
  const kanjiSnapshot = await getDocs(kanjiCol);
  
  // Ora il tipo di ritorno corrisponde a 'LibraryKanji' (con id: string)
  const kanjiList = kanjiSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    ...doc.data(),
    id: doc.id
  } as LibraryKanji)); // Usiamo il tipo esportato
  
  return kanjiList;
};

// --- MODIFICA 2: Usiamo i tipi 'New' per le funzioni 'add' ---
export const addKanji = async (kanji: NewLibraryKanji): Promise<LibraryKanji> => {
  const kanjiCol = collection(db, 'kanjiLibrary');
  const docRef = await addDoc(kanjiCol, kanji);
  // Restituisce il tipo completo 'LibraryKanji'
  return { ...kanji, id: docRef.id }; 
};

export const deleteKanji = async (id: string): Promise<void> => {
  const kanjiDoc = doc(db, 'kanjiLibrary', id);
  await deleteDoc(kanjiDoc);
};

// --- MODIFICA 3: Aggiunta la funzione per aggiornare i Set di un Kanji ---
export const updateKanjiSets = async (kanjiId: string, setId: string, action: 'add' | 'remove'): Promise<void> => {
  const kanjiDoc = doc(db, 'kanjiLibrary', kanjiId);
  
  await updateDoc(kanjiDoc, {
    // 'arrayUnion' aggiunge l'ID solo se non è già presente
    // 'arrayRemove' rimuove tutte le istanze di quell'ID
    sets: action === 'add' ? arrayUnion(setId) : arrayRemove(setId)
  });
};

// --- FUNZIONI PER I SET ---

export const getStudySets = async (): Promise<StudySet[]> => {
  const setsCol = collection(db, 'studySets');
  const setsSnapshot = await getDocs(setsCol);
  
  const setsList = setsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
    ...doc.data(),
    id: doc.id
  } as StudySet)); // Usiamo il tipo esportato
  
  return setsList;
};

export const addSet = async (set: NewStudySet): Promise<StudySet> => {
  const setsCol = collection(db, 'studySets');
  const docRef = await addDoc(setsCol, set);
  return { ...set, id: docRef.id };
};