import React, { useState, useEffect } from 'react';
import * as wanakana from 'wanakana'; 

import { 
  TrashIcon, 
  EditIcon, 
  ArrowLeftIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '../components/Icons'; 

import {
  getStudySets,
  addSet,
  deleteSet,
  getKanjiForSet,
  addKanji,
  deleteKanji,
  updateKanji,
  type StudySet,
  type LibraryKanji,
  type NewStudySet,
  type NewLibraryKanji
} from '../services/kanjiService'; 

// 1. Definizione delle Props
type KanjiManagerProps = {
  refreshDynamicData: () => Promise<void>;
};

export const KanjiManager: React.FC<KanjiManagerProps> = ({ refreshDynamicData }) => {
  // Stati
  const [sets, setSets] = useState<StudySet[]>([]);
  const [kanjiForSet, setKanjiForSet] = useState<LibraryKanji[]>([]); 
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [, setLoadingSets] = useState(true);
  const [, setLoadingKanji] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKanjiChar, setNewKanjiChar] = useState('');
  const [newKanjiReading, setNewKanjiReading] = useState('');
  const [newKanjiMeaning, setNewKanjiMeaning] = useState('');
  const [editingKanji, setEditingKanji] = useState<LibraryKanji | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // (useEffect e handleReadingChange invariati)
  useEffect(() => {
    const loadSets = async () => {
      setLoadingSets(true);
      setError(null);
      try {
        const fetchedSets = await getStudySets();
        setSets(fetchedSets);
      } catch (err) { /* ... */ } finally { setLoadingSets(false); }
    };
    loadSets();
  }, []);

  const handleReadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const romaji = e.target.value;
    const kana = wanakana.toKana(romaji, { isIME: true, useObsoleteKana: false } as any);
    setNewKanjiReading(kana);
  };
  
  const handleSetSelect = async (set: StudySet) => {
    setCurrentSet(set); 
    setLoadingKanji(true);
    setError(null);
    try {
      const fetchedKanji = await getKanjiForSet(set.id);
      setKanjiForSet(fetchedKanji);
    } catch (err) { /* ... */ } finally { setLoadingKanji(false); }
  };

  const handleBackToList = () => {
    setCurrentSet(null); 
    setKanjiForSet([]); 
    setError(null);
    handleCancelEdit();
    setViewMode('list');
  };

  const handleAddSet = async (name: string) => {
    if (name.trim() === '') return;
    const newSetData: NewStudySet = { name: name.trim() };
    try {
      const newSetWithId = await addSet(newSetData);
      if (newSetWithId && newSetWithId.id) {
        setSets([...sets, newSetWithId]);
        await refreshDynamicData(); // Refresh globale
        await handleSetSelect(newSetWithId);
      } else { 
        setError("Impossibile creare il set. ID non ricevuto.");
      }
    } catch (err) { 
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    }
  };
  
  const handleCreateNewSetClick = async () => {
    const name = window.prompt("Come vuoi chiamare il nuovo set?");
    if (name && name.trim() !== '') {
      await handleAddSet(name.trim());
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!window.confirm("Sei sicuro? Questo eliminerà il set E TUTTI i kanji al suo interno.")) return;
    try {
      await deleteSet(setId);
      setSets(sets.filter(set => set.id !== setId));
      await refreshDynamicData(); // Refresh globale
    } catch (err) { /* ... */ }
  };

  const handleCancelEdit = () => {
    setEditingKanji(null);
    setNewKanjiChar('');
    setNewKanjiReading('');
    setNewKanjiMeaning('');
  };
  
  const handleStartEdit = (kanji: LibraryKanji) => {
    setEditingKanji(kanji);
    setNewKanjiChar(kanji.char);
    setNewKanjiReading(kanji.reading);
    setNewKanjiMeaning(kanji.meaning);
  };

  const handleUpdateKanji = async () => {
    if (!editingKanji) return;
    
    const romaji = wanakana.toRomaji(newKanjiReading);
    const updatedData = {
      char: newKanjiChar,
      reading: newKanjiReading,
      romaji: romaji,
      meaning: newKanjiMeaning,
    };
    
    try {
      await updateKanji(editingKanji.id, updatedData);
      // Aggiorna stato locale
      setKanjiForSet(kanjiForSet.map(k => 
        k.id === editingKanji.id ? { ...k, ...updatedData } : k
      ));
      handleCancelEdit();
      // ⭐ CHIAMA REFRESH GLOBALE
      await refreshDynamicData();
    } catch (err) { /* ... */ }
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
      // Aggiorna stato locale
      setKanjiForSet([...kanjiForSet, newKanjiWithId]);
      setNewKanjiChar('');
      setNewKanjiReading('');
      setNewKanjiMeaning('');
      // ⭐ CHIAMA REFRESH GLOBALE
      await refreshDynamicData();
    } catch (err) { /* ... */ }
  };

  const handleDeleteKanji = async (kanjiId: string) => {
    try {
      await deleteKanji(kanjiId);
      // Aggiorna stato locale
      setKanjiForSet(kanjiForSet.filter(k => k.id !== kanjiId));
      // ⭐ CHIAMA REFRESH GLOBALE
      await refreshDynamicData();
    } catch (err) { /* ... */ }
  };

  // --- FUNZIONE MODIFICATA ---
  const renderSetList = () => (
    <>

      {/* Griglia di Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6">
        
        {/* Card #1: Aggiungi Nuovo Set */}
        <button
          onClick={handleCreateNewSetClick}
          className="w-full h-48 p-4 flex flex-col justify-center items-center rounded-2xl shadow-lg bg-white text-gray-400 hover:text-blue-600 hover:shadow-xl transition transform hover:-translate-y-1 border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer group"
          title="Crea un nuovo set"
        >
          <span className="text-8xl font-light text-gray-400 group-hover:text-blue-500 transition-colors pb-4">
            +
          </span>
        </button>

        {/* Card successive: Lista dei set */}
        {sets.map(set => (
          <div 
            key={set.id} 
            className="relative w-full h-48 rounded-2xl shadow-lg bg-white text-gray-800 transition transform hover:shadow-xl hover:-translate-y-1"
          >
            {/* Bottone Card Principale */}
            <button
              onClick={() => handleSetSelect(set)}
              className="w-full h-full p-4 flex flex-col justify-between items-center rounded-2xl"
            >
              <span className="text-7xl font-bold japanese-char text-blue-600 mt-6">
                集
              </span>
              <span className="text-xl font-semibold japanese-char truncate w-full text-center">
                {set.name}
              </span>
            </button>
            
            {/* Bottone Elimina (sovrapposto) */}
            <button
              onClick={() => handleDeleteSet(set.id)}
              className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-100 rounded-full z-10 transition"
              title={`Elimina set ${set.name}`}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </>
  );
  // --- FINE FUNZIONE MODIFICATA ---

  const renderSetDetail = () => (
    <>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        {currentSet?.name}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-10 gap-8">
        {/* --- Colonna Form (invariata) --- */}
        <div className="md:col-span-4 md:col-start-2 space-y-4">
          <div className="w-full p-6 flex flex-col items-center space-y-4 rounded-2xl shadow-lg bg-white">
            <input
              type="text"
              value={newKanjiChar}
              onChange={(e) => setNewKanjiChar(e.target.value)}
              placeholder="私"
              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-8xl font-bold japanese-char text-blue-600 text-center placeholder:text-blue-100"
              maxLength={1}
            />
            <input
              type="text"
              value={newKanjiReading} 
              onChange={handleReadingChange} 
              placeholder="Lettura"
              className="w-full border-none focus:ring-0 focus:outline-none bg-transparent text-3xl font-semibold japanese-char text-gray-800 text-center placeholder:text-gray-300"
              autoComplete="off" 
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>
          <input
            type="text"
            value={newKanjiMeaning}
            onChange={(e) => setNewKanjiMeaning(e.target.value)}
            placeholder="Significato (es. io)"
            className="w-full p-4 bg-white rounded-lg focus:outline-none focus:ring-0 border-none text-lg shadow-lg"
          />
          <button
            onClick={editingKanji ? handleUpdateKanji : handleAddKanji}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {editingKanji ? 'Salva Modifiche' : 'Aggiungi'}
          </button>
          {editingKanji && (
            <button
              onClick={handleCancelEdit}
              className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Annulla
            </button>
          )}
        </div>

        {/* --- Colonna Lista Kanji (invariata) --- */}
        <div className="md:col-span-4 md:col-start-7">
          <div className="p-6 bg-white rounded-lg shadow-md">
            
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-l-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                title="Vista Lista"
              >
                <ListBulletIcon/>
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-r-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                title="Vista Griglia"
              >
                <Squares2X2Icon/>
              </button>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto hide-scrollbar">
              
              {viewMode === 'list' && kanjiForSet.map(kanji => (
                <div key={kanji.id} className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-bold text-2xl japanese-char">{kanji.char}</span>
                  <span className="japanese-char">{kanji.reading}</span>
                  <span>{kanji.meaning}</span>
                  <div className="flex justify-end items-center">
                    <button 
                      onClick={() => handleStartEdit(kanji)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded-full"
                    >
                      <EditIcon/>
                    </button>
                    <button 
                      onClick={() => handleDeleteKanji(kanji.id)} 
                      className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                    >
                      <TrashIcon/>
                    </button>
                  </div>
                </div>
              ))}
              
              {viewMode === 'grid' && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {kanjiForSet.map(kanji => (
                    <div 
                      key={kanji.id} 
                      className="flex justify-center items-center p-2 bg-gray-50 rounded-lg aspect-square"
                      title={`${kanji.reading} (${kanji.meaning})`} 
                    >
                      <span className="font-bold text-2xl japanese-char">{kanji.char}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full p-8 relative"> 
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-4">
          {error}
        </div>
      )}

      {currentSet && (
        <button
          onClick={handleBackToList}
          className="absolute top-8 right-8 p-2 text-gray-500 hover:text-gray-800 transition rounded-full hover:bg-gray-100"
          title="Torna ai set"
        >
          <ArrowLeftIcon/>
        </button>
      )}

      {currentSet ? renderSetDetail() : renderSetList()}
      
    </div>
  );
};