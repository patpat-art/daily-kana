import React from 'react';
import { useState, useEffect } from 'react';

// Importiamo Tipi e Valori
import type { 
  Character, 
  SelectionMap, 
  StudySet, 
  DynamicKanjiMap, 
  LibraryKanji 
} from '../data/characters.ts';
import { CATEGORIES } from '../data/characters.ts'; // Valore

// Importiamo le utility
import { getGridDataForSet } from '../utils/helper.ts';
import { ToggleAllIcon, EditIcon, ArrowLeftIcon } from '../components/Icons.tsx';

// Props aggiornate
interface SettingsScreenProps {
  selectedModes: string[];
  selectionMap: SelectionMap;
  setSelectionMap: React.Dispatch<React.SetStateAction<SelectionMap>>;
  resetProgress: () => Promise<void>;
  direction: 'charToRomaji' | 'romajiToChar';
  isAutoSkipEnabled: boolean;
  setIsAutoSkipEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onPlayClick: () => void;
  
  // Dati separati
  dynamicSets: StudySet[];
  dynamicKanjiMap: DynamicKanjiMap;
}

// Tipi per la navigazione interna
type MainTab = 'hiragana' | 'katakana' | 'kanji';

// --- Pannello Impostazioni ---
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  selectedModes,
  selectionMap,
  setSelectionMap,
  resetProgress,
  direction,
  isAutoSkipEnabled,
  setIsAutoSkipEnabled,
  onPlayClick,
  dynamicSets,
  dynamicKanjiMap
}) => {
  
  // --- STATI INTERNI PER LA NAVIGAZIONE ---
  const [activeTab, setActiveTab] = useState<MainTab>('hiragana');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);

  useEffect(() => {
    // Se i selectedModes cambiano (es. in HomeQuizScreen), aggiorniamo il tab
    const firstSelected = selectedModes[0];
    if (firstSelected === 'hiragana' || firstSelected === 'katakana') {
      setActiveTab(firstSelected);
    } else if (firstSelected) {
      // Se è un set di kanji, impostiamo il tab "kanji"
      setActiveTab('kanji');
    }
  }, [selectedModes]);
  
  
  // --- LOGICA DI SELEZIONE AGGIORNATA ---
  
  const toggleChar = (key: string, setName: string) => {
    onPlayClick();
    setSelectionMap(prev => {
      const newMap = { ...prev };
      const newSet = new Set(newMap[setName] || []);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      newMap[setName] = newSet;
      return newMap;
    });
  };

  const toggleStaticGroup = (charGroup: (Character | null)[], setName: string) => {
    onPlayClick();
    setSelectionMap(prev => {
      const newMap = { ...prev };
      const newSet = new Set(newMap[setName] || []);
      const validChars = charGroup.filter((c): c is Character => c !== null).map(c => c.char);
      if (validChars.length === 0) return prev;
      
      const allSelected = validChars.every(char => newSet.has(char));
      if (allSelected) {
        validChars.forEach(char => newSet.delete(char));
      } else {
        validChars.forEach(char => newSet.add(char));
      }
      newMap[setName] = newSet;
      return newMap;
    });
  };
  
  const handleToggleAllStatic = (gridData: { rows: { chars: (Character | null)[] }[] }, setName: string) => {
    onPlayClick();
    setSelectionMap(prev => {
      const newMap = { ...prev };
      const newSet = new Set(newMap[setName] || []);
      const allCharsInGrid = gridData.rows.flatMap(row => row.chars).filter((c): c is Character => c !== null).map(c => c.char);
      if (allCharsInGrid.length === 0) return prev;
      
      const allSelected = allCharsInGrid.every(char => newSet.has(char));
      
      if (allSelected) {
        allCharsInGrid.forEach(char => newSet.delete(char));
      } else {
        allCharsInGrid.forEach(char => newSet.add(char));
      }
      
      newMap[setName] = newSet;
      return newMap;
    });
  };

  const handleToggleAllDynamic = (kanjiList: LibraryKanji[], setName: string) => {
    onPlayClick();
    setSelectionMap(prev => {
      const newMap = { ...prev };
      const newSet = new Set(newMap[setName] || []);
      // Usiamo 'id' come chiave per i kanji
      const allKeys = kanjiList.map(k => k.id).filter(Boolean) as string[];
      if (allKeys.length === 0) return prev;
      
      const allSelected = allKeys.every(key => newSet.has(key));
      
      if (allSelected) {
        allKeys.forEach(key => newSet.delete(key));
      } else {
        allKeys.forEach(key => newSet.add(key));
      }
      
      newMap[setName] = newSet;
      return newMap;
    });
  };

  // --- FUNZIONI DI RENDERIZZAZIONE ---

  // 1. Griglia STATICA (Hiragana/Katakana)
  const renderStaticSet = (setName: 'hiragana' | 'katakana') => {
    const categoriesForSet = CATEGORIES[setName] || [];
    
    return (
      <div className="space-y-6">
        {categoriesForSet.map(cat => {
          const gridData = getGridDataForSet(setName, cat.id);
          if (gridData.header.length === 0) return null;

          return (
            <div key={cat.id}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold text-gray-600">{cat.name}</h3>
                <button 
                  onClick={() => handleToggleAllStatic(gridData, setName)} 
                  className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
                  title="Seleziona/Deseleziona Tutti"
                >
                  <ToggleAllIcon />
                </button>
              </div>
              <div className="flex space-x-1">
                <div className="grow flex flex-col space-y-1">
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${gridData.header.length}, minmax(0, 1fr))` }}>
                    {gridData.header.map((col, colIndex) => (
                      <button 
                        key={col.id} 
                        onClick={() => toggleStaticGroup(gridData.rows.map(r => r.chars[colIndex]), setName)}
                        className="w-full text-center py-1 text-sm font-medium text-gray-500 rounded-md hover:bg-gray-200"
                        title={`Seleziona/Deseleziona colonna ${col.label}`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                  {gridData.rows.map(row => (
                    <div key={row.id} className="grid" style={{ gridTemplateColumns: `repeat(${gridData.header.length}, minmax(0, 1fr))` }}>
                      {row.chars.map((charData, index) => {
                        if (!charData) {
                          return <div key={`empty-${row.id}-${index}`} className="w-full h-12 bg-gray-50 border border-gray-100 rounded-sm"></div>;
                        }
                        const isSelected = selectionMap[setName]?.has(charData.char);
                        return (
                          <button
                            key={charData.char}
                            onClick={() => toggleChar(charData.char, setName)}
                            className={`w-full h-12 flex items-center justify-center text-xl font-bold rounded-sm border-2
                                        transition-all japanese-char
                                        ${isSelected 
                                          ? 'bg-blue-600 text-white border-blue-600' 
                                          : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
                                        }`}
                          >
                            {charData.char}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col space-y-1" style={{ paddingTop: '28px' }}>
                   {gridData.rows.map(row => (
                       <button 
                          key={row.id} 
                          onClick={() => toggleStaticGroup(row.chars, setName)}
                          className="w-8 h-12 flex items-center justify-center font-bold text-gray-600 text-xs rounded-md hover:bg-gray-200"
                          title={`Seleziona/Deseleziona riga ${row.label.toUpperCase()}`}
                       >
                           {row.label.toUpperCase()}
                       </button>
                   ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 2. Menu dei Set di KANJI (MODIFICATO)
  const renderKanjiSetMenu = () => {
    return (
      <div className="space-y-6">
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dynamicSets.map((set) => {
              const kanjiList = dynamicKanjiMap[set.id] || [];
              const allKeys = kanjiList.map(k => k.id);
              const selectedKeys = selectionMap[set.id] || new Set();
              
              const allSelected = allKeys.length > 0 && allKeys.every(key => selectedKeys.has(key));
              const someSelected = !allSelected && allKeys.some(key => selectedKeys.has(key));

              // --- ⭐ INIZIO MODIFICA ESTETICA ---
              
              let cardStyle = '';
              let editIconStyle = 'text-gray-500 hover:text-blue-700'; // Default (su sfondo bianco)

              if (allSelected) {
                cardStyle = 'bg-blue-600 text-white border-blue-600 shadow-lg';
                editIconStyle = 'text-white hover:text-white/80'; // Icona bianca su sfondo blu
              } else if (someSelected) {
                cardStyle = 'bg-blue-50 text-blue-700 border-transparent shadow-md';
                editIconStyle = 'text-blue-600 hover:text-blue-800'; // Icona blu su sfondo azzurro
              } else {
                cardStyle = 'bg-white text-gray-800 border-transparent shadow-md hover:shadow-lg hover:-translate-y-1';
              }

              // --- ⭐ FINE MODIFICA ESTETICA ---

              return (
                <div key={set.id} className="relative">
                  <button
                    onClick={() => handleToggleAllDynamic(kanjiList, set.id)}
                    title={`Clicca to Seleziona/Deseleziona tutti i ${kanjiList.length} kanji in "${set.name}"`}
                    className={`w-full h-36 p-4 flex flex-col items-center justify-center text-xl font-bold rounded-xl border-2
                                transition-all japanese-char ${cardStyle}`}
                  >
                    <span className="text-5xl mb-2">集</span>
                    <span className="text-lg font-semibold capitalize truncate w-full px-2 text-center">{set.name}</span>
                    <span className="text-xs font-normal">
                      {selectedKeys.size} / {allKeys.length}
                    </span>
                  </button>
                  {/* Bottone Modifica (con stile dinamico) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      onPlayClick();
                      setEditingSetId(set.id);
                    }}
                    title={`Modifica kanji in "${set.name}"`}
                    // ⭐ APPLICA STILE DINAMICO
                    className={`absolute top-2 right-2 p-2 transition ${editIconStyle}`}
                  >
                    <EditIcon />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 3. Griglia di Dettaglio KANJI (MODIFICATO)
  const renderKanjiDetailGrid = (setId: string) => {
    const kanjiList = dynamicKanjiMap[setId] || [];
    const set = dynamicSets.find(s => s.id === setId);

    return (
      <div className="space-y-6">
        <div key={setId}>
          {/* Header con bottone "Indietro" */}
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setEditingSetId(null)}
              className="flex items-center text-gray-500 hover:text-blue-600"
            >
              <ArrowLeftIcon />
              <span className="ml-1">Tutti i Set</span>
            </button>
            <button 
              onClick={() => handleToggleAllDynamic(kanjiList, setId)} 
              className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
              title="Seleziona/Deseleziona Tutti"
            >
              <ToggleAllIcon />
            </button>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 capitalize japanese-char mb-4">{set?.name}</h3>
          
          {/* Griglia Densa (come Hiragana/Katakana) */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-y-2">
            {kanjiList.map((charObj) => {
              const key = charObj.id as string;
              const isSelected = selectionMap[setId]?.has(key);
              
              return (
                <button
                  key={key}
                  onClick={() => toggleChar(key, setId)}
                  title={`${charObj.reading} (${charObj.meaning})`}
                  className={`w-full h-12 flex items-center justify-center text-xl font-bold rounded-sm border-2
                              transition-all japanese-char
                              ${isSelected 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'
                              }`}
                >
                  {charObj.char}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // --- RENDER PRINCIPALE ---

return (
  <div 
    className="w-full p-8"
  >
    {/* Contenuto di SettingsPanel */}
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">

      {/* 1. TAB (Statici) */}
      <div className="flex border-b mb-4">
        <button
          key="hiragana"
          className={`py-2 px-4 capitalize japanese-char ${activeTab === 'hiragana' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
          onClick={() => { onPlayClick(); setActiveTab('hiragana'); setEditingSetId(null); }}
        >
          Hiragana
        </button>
        <button
          key="katakana"
          className={`py-2 px-4 capitalize japanese-char ${activeTab === 'katakana' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
          onClick={() => { onPlayClick(); setActiveTab('katakana'); setEditingSetId(null); }}
        >
          Katakana
        </button>
        <button
          key="kanji"
          className={`py-2 px-4 capitalize japanese-char ${activeTab === 'kanji' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
          onClick={() => { onPlayClick(); setActiveTab('kanji'); }}
        >
          Kanji
        </button>
      </div>
      
      {/* 2. CONTENUTO TAB (Logica condizionale) */}
      <div className="mt-6">
        {activeTab === 'hiragana' && renderStaticSet('hiragana')}
        {activeTab === 'katakana' && renderStaticSet('katakana')}
        {activeTab === 'kanji' && (
          editingSetId ? renderKanjiDetailGrid(editingSetId) : renderKanjiSetMenu()
        )}
      </div>
      
      {/* 3. OPZIONI (Invariato) */}
      <div className="border-t pt-6 mt-6 space-y-6">
        {direction === 'charToRomaji' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Training Options</h3>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-gray-50">
              <span className="text-sm text-gray-700">Auto-Skip</span>
              <input
                type="checkbox"
                checked={isAutoSkipEnabled}
                onChange={(e) => {
                  onPlayClick();
                  setIsAutoSkipEnabled(e.target.checked)
                }}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2 pl-2">If enabled, it skips to the next question as soon as you type the correct answer.</p>
          </div>
        )}
      
        <div>
           <h3 className="text-lg font-semibold text-gray-700 mb-3">Data Management</h3>
           <button
              onClick={() => {
                onPlayClick();
                resetProgress();
              }}
              className="w-full px-6 bg-red-100 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-200 transition shadow-md"
            >
              Reset Progress...
            </button>
        </div>
      </div>
    </div>
    </div> 
    
  );
};