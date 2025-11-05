import React, { useState, useEffect } from 'react';
// --- MODIFICA 1: Rimosse 'StudyIcon' e 'PlusIcon' perché non usate ---
import { TrashIcon, EditIcon } from '../components/Icons'; 

// --- MODIFICA 2: IMPORTIAMO i nostri tipi dal service ---
import {
  getKanjiLibrary,
  addKanji,
  deleteKanji,
  getStudySets,
  addSet,
  updateKanjiSets, // Importiamo la nuova funzione
  // Importiamo i TIPI (con la keyword 'type')
  type LibraryKanji,
  type StudySet,
  type NewLibraryKanji,
  type NewStudySet
} from '../services/kanjiService'; // Assicurati che il percorso sia corretto!


// --- MODIFICA 3: ELIMINATE le definizioni dei tipi locali ---
// type LibraryKanji = { ... }; // ELIMINATO
// type StudySet = { ... }; // ELIMINATO


export const KanjiManager: React.FC = () => {
  // Gli stati ora usano i tipi importati. Funziona tutto.
  const [sets, setSets] = useState<StudySet[]>([]);
  const [kanjiLibrary, setKanjiLibrary] = useState<LibraryKanji[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stati per i form (invariati)
  const [newSetName, setNewSetName] = useState('');
  const [newKanjiChar, setNewKanjiChar] = useState('');
  const [newKanjiReading, setNewKanjiReading] = useState('');
  const [newKanjiMeaning, setNewKanjiMeaning] = useState('');
  
  const [editingSet, setEditingSet] = useState<StudySet | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedSets, fetchedKanji] = await Promise.all([
          getStudySets(),
          getKanjiLibrary()
        ]);
        
        // Ora i tipi corrispondono perfettamente
        setSets(fetchedSets);
        setKanjiLibrary(fetchedKanji);
        
      } catch (err) {
        console.error("Errore nel caricamento dati:", err);
        setError("Impossibile caricare i dati. Riprova più tardi.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddSet = async () => {
    if (newSetName.trim() === '') return;
    
    // --- MODIFICA 4: Usiamo il tipo 'NewStudySet' ---
    const newSetData: NewStudySet = { name: newSetName };
    
    try {
      const newSetWithId = await addSet(newSetData);
      setSets([...sets, newSetWithId]);
      setNewSetName('');
    } catch (err) {
      console.error("Errore aggiunta set:", err);
    }
  };

  const handleAddKanji = async () => {
    if (!newKanjiChar.trim() || !newKanjiReading.trim() || !newKanjiMeaning.trim()) return;
    
    // --- MODIFICA 5: Usiamo il tipo 'NewLibraryKanji' ---
    const newKanjiData: NewLibraryKanji = {
      char: newKanjiChar,
      reading: newKanjiReading,
      meaning: newKanjiMeaning,
      sets: [],
    };
    
    try {
      const newKanjiWithId = await addKanji(newKanjiData);
      setKanjiLibrary([...kanjiLibrary, newKanjiWithId]);
      setNewKanjiChar('');
      setNewKanjiReading('');
      setNewKanjiMeaning('');
    } catch (err)
 {
      console.error("Errore aggiunta kanji:", err);
    }
  };

  const handleDeleteKanji = async (id: string) => {
    try {
      await deleteKanji(id);
      setKanjiLibrary(kanjiLibrary.filter(k => k.id !== id));
    } catch (err) {
      console.error("Errore eliminazione kanji:", err);
    }
  };
  
  // --- MODIFICA 6: Logica 'toggleKanjiInSet' aggiornata per Firestore ---
  const toggleKanjiInSet = async (kanjiId: string) => {
    if (!editingSet) return;

    const kanjiToUpdate = kanjiLibrary.find(k => k.id === kanjiId);
    if (!kanjiToUpdate) return;

    const isInSet = kanjiToUpdate.sets.includes(editingSet.id);
    const action = isInSet ? 'remove' : 'add';
    
    // 1. Aggiorna lo stato locale (UI ottimistica)
    const newSetIds = isInSet
      ? kanjiToUpdate.sets.filter(setId => setId !== editingSet.id)
      : [...kanjiToUpdate.sets, editingSet.id];
      
    setKanjiLibrary(prevLibrary => 
      prevLibrary.map(kanji => 
        kanji.id === kanjiId ? { ...kanji, sets: newSetIds } : kanji
      )
    );

    // 2. Chiama Firestore per rendere la modifica permanente
    try {
      await updateKanjiSets(kanjiId, editingSet.id, action);
    } catch (err) {
      console.error("Errore aggiornamento kanji. Ripristino.", err);
      // Se fallisce, rimetti lo stato com'era
      setKanjiLibrary(prevLibrary => 
        prevLibrary.map(kanji => 
          kanji.id === kanjiId ? { ...kanji, sets: kanjiToUpdate.sets } : kanji
        )
      );
    }
  };


  if (loading) {
    return (
      <div className="w-full p-8 h-full flex items-center justify-center">
        <h2 className="text-2xl font-semibold text-gray-700">Caricamento...</h2>
      </div>
    );
  }

  if (error) {
     return (
      <div className="w-full p-8 h-full flex items-center justify-center">
        <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
      </div>
    );
  }

  // --- Il resto del file (tutte le funzioni 'render...' e il return) ---
  // --- rimane ESATTAMENTE COME PRIMA.                 ---
  // --- Non c'è bisogno di modificarlo.                 ---

  const renderSetManagement = () => (
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-semibold mb-4">I Miei Set di Studio</h2>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSetName}
          onChange={(e) => setNewSetName(e.target.value)}
          placeholder="Nome del nuovo set (es. Capitolo 1)"
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAddSet}
          className="p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Crea
        </button>
      </div>

      <div className="space-y-2">
        {sets.length === 0 && (
          <p className="text-gray-500 text-center p-4">
            Non hai ancora creato nessun set.
          </p>
        )}
        {sets.map(set => (
          <div key={set.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">{set.name}</span>
            <div>
              <button onClick={() => setEditingSet(set)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                <EditIcon />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderKanjiManagement = () => (
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-semibold mb-4">La Mia Libreria Kanji</h2>
      
      <div className="p-4 border border-gray-200 rounded-lg mb-6 space-y-3">
        <h3 className="text-lg font-semibold">Aggiungi Nuovo Kanji</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={newKanjiChar}
            onChange={(e) => setNewKanjiChar(e.target.value)}
            placeholder="Kanji (es. 私)"
            className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 japanese-char text-lg"
          />
          <input
            type="text"
            value={newKanjiReading}
            onChange={(e) => setNewKanjiReading(e.target.value)}
            placeholder="Lettura (es. わたし)"
            className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 japanese-char text-lg"
          />
          <input
            type="text"
            value={newKanjiMeaning}
            onChange={(e) => setNewKanjiMeaning(e.target.value)}
            placeholder="Significato (es. io)"
            className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
          />
        </div>
        <button
          onClick={handleAddKanji}
          className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Aggiungi alla Libreria
        </button>
      </div>

      <div className="space-y-2">
        {kanjiLibrary.length === 0 && (
          <p className="text-gray-500 text-center p-4">
            La tua libreria è vuota. Aggiungi il tuo primo kanji!
          </p>
        )}
        {kanjiLibrary.map(kanji => (
          <div key={kanji.id} className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-bold text-2xl japanese-char">{kanji.char}</span>
            <span className="japanese-char">{kanji.reading}</span>
            <span>{kanji.meaning}</span>
            <div className="text-right">
              <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                <EditIcon />
              </button>
              <button onClick={() => handleDeleteKanji(kanji.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderSetEditor = () => {
    if (!editingSet) return null;

    const kanjiInSet = new Set(kanjiLibrary.filter(k => k.sets.includes(editingSet.id)).map(k => k.id));
    
    return (
       <div className="p-6 bg-white rounded-lg shadow-md mt-6">
        <button onClick={() => setEditingSet(null)} className="mb-4 text-blue-600 font-semibold">&larr; Torna ai Set</button>
        <h2 className="text-2xl font-semibold mb-4">Modifica Set: <span className="text-blue-600">{editingSet.name}</span></h2>
        <p className="text-gray-600 mb-4">Seleziona i kanji da includere in questo set dalla tua libreria.</p>
        
        <div className="space-y-2 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded-lg">
          {kanjiLibrary.length === 0 && (
            <p className="text-gray-500 text-center p-4">
              La tua libreria è vuota. Aggiungi prima qualche kanji.
            </p>
          )}
          {kanjiLibrary.map(kanji => (
            <label key={kanji.id} className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={kanjiInSet.has(kanji.id)}
                onChange={() => toggleKanjiInSet(kanji.id)} 
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-xl japanese-char font-bold">{kanji.char}</span>
              <span className="ml-2 japanese-char">{kanji.reading}</span>
              <span className="ml-auto text-gray-500">{kanji.meaning}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        I Miei Kanji
      </h1>
      
      {!editingSet ? renderSetManagement() : renderSetEditor()}
      {!editingSet && renderKanjiManagement()}
    </div>
  );
};