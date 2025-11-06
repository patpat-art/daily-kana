import React, { useState, useEffect } from 'react';
import { CHARACTER_SETS, CATEGORIES, type Character } from '../data/characters.ts';
import { getGridDataForSet, speak } from '../utils/helper.ts';
// import { SpeechOnIcon, SpeechOffIcon } from './Icons.tsx'; // RIMOSSO

// Props per StudyPanel
interface StudyPanelProps {
  onClose: () => void;
  visibleSets: string[]; // Mantenuto per determinare il tab attivo iniziale
  allSetNames: string[]; // <-- NUOVA PROP: La lista di tutti i set
  onPlayClick: () => void;
  isSpeechEnabled: boolean;
  setIsSpeechEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  initAudio: () => void;
}

// --- NUOVO: Pannello Modalità Studio ---
export const StudyPanel: React.FC<StudyPanelProps> = ({ 
  onClose, 
  visibleSets,
  allSetNames, // <-- NUOVA PROP
  onPlayClick,
  isSpeechEnabled,
  initAudio,
}) => {
  // Logica migliorata: usa visibleSets[0] se esiste, altrimenti il primo di tutti i set
  const [activeTab, setActiveTab] = useState(visibleSets[0] || allSetNames[0]);

  // Questo assicura che un tab valido sia sempre selezionato
  useEffect(() => {
    if (!allSetNames.includes(activeTab)) {
      setActiveTab(allSetNames[0]);
    }
  }, [allSetNames, activeTab]);
  
  const handleClose = () => {
      onPlayClick();
      onClose();
  }

  const handleCharClick = (char: string, _romaji: string | string[]) => {
    initAudio(); // Assicura che l'audio sia pronto
    onPlayClick(); // Riproduce solo il suono del click
    if (isSpeechEnabled) {
      speak(char); // Parla il carattere (usa lo stato audio globale)
    }
  };

  const activeSetName = activeTab; // Usiamo direttamente lo stato
  if (!activeSetName) return null; // Sicurezza se allSetNames è vuoto

  const setName = activeSetName;
  const categoriesForSet = CATEGORIES[setName] || [];
  
  return (
    <div 
      className="bg-white w-full h-full p-6 overflow-y-auto shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-2 border-b">
        <h2 className="text-2xl font-bold capitalize">Study Panel</h2>
        {/* --- Pulsanti Speech e Chiudi --- */}
        <div className="flex items-center space-x-2">
          
          {/* --- PULSANTE SPEECH RIMOSSO --- */}
          
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none">
            &times;
          </button>
        </div>
      </div>
      
      {/* --- MODIFICA CHIAVE --- */}
      {/* Ora mappiamo su 'allSetNames' per mostrare sempre tutti i tab */}
      <div className="flex border-b mb-4">
        {allSetNames.map((modeName: string) => ( 
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
      {/* --- FINE MODIFICA CHIAVE --- */}
      
      <div className="space-y-6">
        {categoriesForSet.map(cat => {
          if (setName === 'kanji_basic') {
            const allKanji = CHARACTER_SETS[setName];
            return (
              <div key="kanji-grid">
                 <h3 className="text-md font-semibold text-gray-600 mb-2">{cat.name}</h3>
                 <div className="grid grid-cols-5 gap-2">
                   {allKanji.map((charObj: Character) => (
                     <button
                       key={charObj.char}
                       onClick={() => handleCharClick(charObj.char, charObj.romaji)}
                       className={`w-full h-16 flex flex-col items-center justify-center text-xl font-bold rounded-md border-2
                                  transition-all japanese-char bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-200`}
                     >
                       <span className="text-2xl">{charObj.char}</span>
                       <span className="text-xs font-normal">{Array.isArray(charObj.romaji) ? charObj.romaji[0] : charObj.romaji}</span>
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
              <h3 className="text-md font-semibold text-gray-600 mb-2">{cat.name}</h3>
              <div className="flex space-x-1">
                <div className="grow flex flex-col space-y-1">
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${gridData.header.length}, minmax(0, 1fr))` }}>
                    {gridData.header.map(col => (
                      <div 
                        key={col.id} 
                        className="w-full text-center py-1 text-sm font-medium text-gray-500 rounded-md"
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>
                  {gridData.rows.map(row => (
                    <div key={row.id} className="grid" style={{ gridTemplateColumns: `repeat(${gridData.header.length}, minmax(0, 1fr))` }}>
                      {row.chars.map((charData, index) => {
                        if (!charData) {
                          return <div key={`empty-${row.id}-${index}`} className="w-full h-16 bg-gray-50 border border-gray-100 rounded-sm"></div>;
                        }
                        const romaji = Array.isArray(charData.romaji) ? charData.romaji[0] : charData.romaji;
                        return (
                          <button
                            key={charData.char}
                            onClick={() => handleCharClick(charData.char, romaji)}
                            className={`w-full h-16 flex flex-col items-center justify-center text-xl font-bold rounded-sm border-2
                                        transition-all japanese-char bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-200`}
                          >
                            <span className="text-2xl">{charData.char}</span>
                            <span className="text-xs font-normal">{romaji}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col space-y-1" style={{ paddingTop: '28px' }}>
                   {gridData.rows.map(row => (
                       <div 
                          key={row.id} 
                          className="w-8 h-16 flex items-center justify-center font-bold text-gray-600 text-xs rounded-md"
                       >
                           {row.label.toUpperCase()}
                       </div>
                   ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};