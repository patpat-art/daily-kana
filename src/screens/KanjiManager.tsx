// src/screens/KanjiManager.tsx

import React, { useState, useEffect } from 'react';
import * as wanakana from 'wanakana'; 

import { TrashIcon, EditIcon } from '../components/Icons'; 
import {
  getStudySets,
  addSet,
  deleteSet,
  getKanjiForSet,
  addKanji,
  deleteKanji,
  type StudySet,
  type LibraryKanji,
  type NewStudySet,
  type NewLibraryKanji
} from '../services/kanjiService'; 

export const KanjiManager: React.FC = () => {
  // Stati (invariati)
  const [sets, setSets] = useState<StudySet[]>([]);
  const [kanjiForSet, setKanjiForSet] = useState<LibraryKanji[]>([]); 
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingKanji, setLoadingKanji] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSetName, setNewSetName] = useState('');
  const [newKanjiChar, setNewKanjiChar] = useState('');
  const [newKanjiReading, setNewKanjiReading] = useState('');
  const [newKanjiMeaning, setNewKanjiMeaning] = useState('');

  // Caricamento Set (invariato)
  useEffect(() => {
    const loadSets = async () => {
      setLoadingSets(true);
      setError(null);
      try {
        const fetchedSets = await getStudySets();
        setSets(fetchedSets);
      } catch (err) {
        console.error("Errore caricamento set:", err);
        setError("Impossibile caricare i tuoi set.");
      } finally {
        setLoadingSets(false);
      }
    };
    loadSets();
  }, []);

  // Nuova funzione 'handler' per l'input di lettura
  const handleReadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const romaji = e.target.value;
    
    // --- CORREZIONE 1: Aggiunto 'as any' ---
    const kana = wanakana.toKana(romaji, { isIME: true, useObsoleteKana: false } as any);
    
    setNewKanjiReading(kana);
  };
  
  // (Tutte le altre funzioni handler sono invariate)
  const handleSetSelect = async (set: StudySet) => {
    setCurrentSet(set); 
    setLoadingKanji(true);
    setError(null);
    try {
      const fetchedKanji = await getKanjiForSet(set.id);
      setKanjiForSet(fetchedKanji);
    } catch (err) {
      console.error("Errore caricamento kanji:", err);
      setError("Impossibile caricare i kanji per questo set.");
    } finally {
      setLoadingKanji(false);
    }
  };

  const handleBackToList = () => {
    setCurrentSet(null); 
    setKanjiForSet([]); 
    setError(null);
  };

  const handleAddSet = async () => {
    if (newSetName.trim() === '') return;
    const newSetData: NewStudySet = { name: newSetName };
    try {
      const newSetWithId = await addSet(newSetData);
      
      if (newSetWithId && newSetWithId.id) {
        setSets([...sets, newSetWithId]);
        setNewSetName('');
      } else {
        console.error("FALLIMENTO: 'addSet' non ha restituito un oggetto valido.");
        setError("Errore sconosciuto: i dati creati non sono validi.");
      }
      
    } catch (err) {
      console.error("Errore aggiunta set (nel catch):", err);
      setError("Impossibile aggiungere il set.");
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!window.confirm("Sei sicuro? Questo eliminerà il set E TUTTI i kanji al suo interno.")) {
      return;
    }
    try {
      await deleteSet(setId);
      setSets(sets.filter(set => set.id !== setId));
    } catch (err) {
      console.error("Errore eliminazione set:", err);
      setError("Impossibile eliminare il set.");
    }
  };

  const handleAddKanji = async () => {
    if (!currentSet) return;
    if (!newKanjiChar.trim() || !newKanjiReading.trim() || !newKanjiMeaning.trim()) return;
    
    const romaji = wanakana.toRomaji(newKanjiReading);

    const newKanjiData: NewLibraryKanji = {
      char: newKanjiChar,
      reading: newKanjiReading, 
      romaji: romaji,           
      meaning: newKanjiMeaning,
      setId: currentSet.id,
    };
    
    try {
      const newKanjiWithId = await addKanji(newKanjiData);
      setKanjiForSet([...kanjiForSet, newKanjiWithId]);
      
      setNewKanjiChar('');
      setNewKanjiReading('');
      setNewKanjiMeaning('');
    } catch (err) {
      console.error("Errore aggiunta kanji:", err);
      setError("Impossibile aggiungere il kanji.");
    }
  };

  const handleDeleteKanji = async (kanjiId: string) => {
    try {
      await deleteKanji(kanjiId);
      setKanjiForSet(kanjiForSet.filter(k => k.id !== kanjiId));
    } catch (err) {
      console.error("Errore eliminazione kanji:", err);
      setError("Impossibile eliminare il kanji.");
    }
  };

  const renderSetList = () => (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-semibold mb-4">Crea un Nuovo Set</h2>
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
      </div>
      <div className="p-6 bg-white rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-semibold mb-4">I Miei Set di Studio</h2>
        {loadingSets && <p>Caricamento set...</p>}
        {sets.length === 0 && !loadingSets && (
          <p className="text-gray-500 text-center p-4">
            Non hai ancora creato nessun set.
          </p>
        )}
        <div className="space-y-2">
          {sets.map(set => (
            <div key={set.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-lg">{set.name}</span>
              <div>
                <button 
                  onClick={() => handleSetSelect(set)} 
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                >
                  <EditIcon />
                </button>
                <button 
                  onClick={() => handleDeleteSet(set.id)} 
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderSetDetail = () => (
    <>
      <button onClick={handleBackToList} className="mb-4 text-blue-600 font-semibold">
        &larr; Torna a tutti i set
      </button>
      
      <div className="p-6 bg-white rounded-lg shadow-md mt-6">
        <h2 className="text-2xl font-semibold mb-4">
          Gestisci Set: <span className="text-blue-600">{currentSet?.name}</span>
        </h2>
        
        <div className="p-4 border border-gray-200 rounded-lg mb-6 space-y-3">
          <h3 className="text-lg font-semibold">Aggiungi Nuovo Kanji a questo Set</h3>
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
              onChange={handleReadingChange} 
              placeholder="Lettura (digita romaji)" 
              className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 japanese-char text-lg"
              autoComplete="off" 
              autoCapitalize="off"
              autoCorrect="off"
            />
            
            <input
              type="text"
              value={newKanjiMeaning}
              // --- CORREZIONE 2: Corretto 'e.targe' in 'e.target' ---
              onChange={(e) => setNewKanjiMeaning(e.target.value)}
              placeholder="Significato (es. io)"
              className="p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
            />
          </div>
          <button
            onClick={handleAddKanji}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Aggiungi al Set
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-3">Kanji in questo set</h3>
        {loadingKanji && <p>Caricamento kanji...</p>}
        {kanjiForSet.length === 0 && !loadingKanji && (
          <p className="text-gray-500 text-center p-4">
            Questo set è vuoto. Aggiungi il tuo primo kanji!
          </p>
        )}
        <div className="space-y-2">
          {kanjiForSet.map(kanji => (
            <div key={kanji.id} className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-bold text-2xl japanese-char">{kanji.char}</span>
              <span className="japanese-char">{kanji.reading}</span>
              <span>{kanji.meaning}</span>
              <div className="text-right">
                <button 
                  onClick={() => handleDeleteKanji(kanji.id)} 
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        I Miei Kanji
      </h1>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
          {error}
        </div>
      )}

      {currentSet ? renderSetDetail() : renderSetList()}
      
    </div>
  );
};