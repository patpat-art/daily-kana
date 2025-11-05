import React, { useState, useEffect } from 'react';
import { CHARACTER_SETS, CATEGORIES } from '../data/characters.ts';
import { getGridDataForSet } from '../utils/helper.ts';
import type { Character, SelectionMap } from '../data/characters.ts';
import { ToggleAllIcon } from './Icons.tsx';

// Props per SettingsPanel
interface SettingsPanelProps {
  selectedModes: string[];
  selectionMap: SelectionMap;
  setSelectionMap: React.Dispatch<React.SetStateAction<SelectionMap>>;
  resetProgress: () => Promise<void>;
  direction: 'charToRomaji' | 'romajiToChar';
  isAutoSkipEnabled: boolean;
  setIsAutoSkipEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onPlayClick: () => void;
}

// --- Pannello Impostazioni (Modificato per scorrimento e bottone Toggle-All) ---
export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  selectedModes,
  selectionMap,
  setSelectionMap,
  resetProgress,
  direction,
  isAutoSkipEnabled,
  setIsAutoSkipEnabled,
  onPlayClick
}) => {
  const [activeTab, setActiveTab] = useState(selectedModes[0]);

  useEffect(() => {
    if (!selectedModes.includes(activeTab)) {
      setActiveTab(selectedModes[0]);
    }
  }, [selectedModes, activeTab]);
  

  const activeSetName = activeTab || selectedModes[0];
  if (!activeSetName) return null;

  const setName = activeSetName;
  const categoriesForSet = CATEGORIES[setName] || [];
  
  const toggleChar = (char: string) => {
    onPlayClick();
    setSelectionMap(prev => {
      const newMap = { ...prev };
      // Assicurati che il set per questo setName esista
      const newSet = new Set(newMap[setName] || []);
      if (newSet.has(char)) {
        newSet.delete(char);
      } else {
        newSet.add(char);
      }
      newMap[setName] = newSet;
      return newMap;
    });
  };

  const toggleGroup = (charGroup: (Character | null)[]) => {
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
  
  const handleToggleAll = (gridData: { rows: { chars: (Character | null)[] }[] }) => {
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

return (
  <div 
    className="w-full p-8" // <-- Layout pulito (come Dashboard)
    // onClick rimosso
  >
    <div className="flex justify-between items-center mb-2">
      <h1 className="text-4xl font-bold text-gray-800">
        Impostazioni
      </h1>
      {/* Pulsante 'X' rimosso */}
    </div>
    
    {/* Contenuto di SettingsPanel */}
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">
      
      <div className="flex border-b mb-4">
        {selectedModes.map((modeName: string) => ( // CORREZIONE: Aggiunto tipo string
          <button
            key={modeName}
            className={`py-2 px-4 capitalize japanese-char ${activeTab === modeName ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
            onClick={() => {
              onPlayClick();
              setActiveTab(modeName);
            }}
          >
            {modeName.replace('_', ' ')}
          </button>
        ))}
      </div>
      
      <div className="space-y-6">
        {categoriesForSet.map(cat => {
          if (setName === 'kanji_basic') {
            const allKanji = CHARACTER_SETS[setName];
            const gridData = { rows: [{ chars: allKanji }] }; // Simula gridData per handleToggleAll
            return (
              <div key="kanji-grid">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold text-gray-600">{cat.name}</h3>
                  <button 
                    onClick={() => handleToggleAll(gridData)} 
                    className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
                    title="Seleziona/Deseleziona Tutti"
                  >
                    <ToggleAllIcon />
                  </button>
                </div>
                 <div className="grid grid-cols-5 gap-2">
                   {allKanji.map((charObj: Character) => ( // CORREZIONE: Aggiunto tipo Character
                     <button
                       key={charObj.char} // CORREZIONE: 'key' è una stringa
                       onClick={() => toggleChar(charObj.char)}
                       className={`w-full h-12 flex items-center justify-center text-xl font-bold rounded-md border-2
                                  transition-all japanese-char
                                  ${selectionMap[setName]?.has(charObj.char) 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-gray-200 text-gray-700 border-gray-200 hover:border-gray-400'
                                  }`}
                     >
                       {charObj.char}
                     </button>
                   ))}
                 </div>
              </div>
            );
          }
          
          const gridData = getGridDataForSet(setName, cat.id);
          if (gridData.header.length === 0) return null;

          return (
            <div key={cat.id}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold text-gray-600">{cat.name}</h3>
                <button 
                  onClick={() => handleToggleAll(gridData)} 
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
                        onClick={() => toggleGroup(gridData.rows.map(r => r.chars[colIndex]))}
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
                            onClick={() => toggleChar(charData.char)}
                            className={`w-full h-12 flex items-center justify-center text-xl font-bold rounded-sm border-2
                                        transition-all japanese-char
                                        ${isSelected 
                                          ? 'bg-blue-600 text-white border-blue-600' 
                                          : 'bg-gray-200 text-gray-700 border-gray-200 hover:border-gray-400'
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
                          onClick={() => toggleGroup(row.chars)}
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
    </div> // <-- 1. AGGIUNGI QUESTO (Chiude il div "p-6 bg-white...")
    
  );
};
