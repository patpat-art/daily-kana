import React from 'react';

// 1. IMPORTA I COMPONENTI CHE USERAI
import { SetupCard } from '../components/SetupCard';
import { DirectionToggle } from '../components/DirectionSelector';
import { StudyIcon, StreakIcon } from '../components/Icons'; 
// ⭐ Rimosso l'import di 'StudySet'

// 2. DEFINISCI I TIPI PER LE PROPS
type Direction = 'charToRomaji' | 'romajiToChar';

// 3. DEFINISCI LE PROPS CHE IL COMPONENTE RICEVERÀ
type HomeScreenProps = {
  screen: 'home' | 'quiz';
  handlePlayClick: () => void;
  selectedSets: string[];
  toggleMode: (modeName: string) => void;
  direction: Direction;
  setDirection: (value: React.SetStateAction<Direction>) => void;
  setShowStudyPanel: (value: React.SetStateAction<boolean>) => void;
  startQuiz: () => void;
  available: { length: number }; 
  isTimedMode: boolean;
  setIsTimedMode: (value: React.SetStateAction<boolean>) => void;
  
  // ⭐ Rimosso 'dynamicSets'
};

// 4. CREA IL COMPONENTE
export const HomeQuizScreen: React.FC<HomeScreenProps> = ({
  // 5. "DESTRUTTURA" LE PROPS
  screen,
  handlePlayClick,
  selectedSets,
  toggleMode,
  direction,
  setDirection,
  setShowStudyPanel,
  startQuiz,
  available,
  isTimedMode,
  setIsTimedMode,
  // ⭐ Rimosso 'dynamicSets'
}) => {
  
  // 6. AGGIUNGI IL RETURN
  return (
        <div className={`w-full h-full p-8 flex flex-col justify-center items-center relative
                        transition-all duration-500 ease-in-out
                        ${screen === 'quiz' ? '-translate-x-full opacity-70' : 'translate-x-0 opacity-100'}`}>
          
          {/* ⭐ MODIFICA: Ripristinata la visualizzazione a 3 card */}
          <div className="flex flex-row space-x-4 md:space-x-8 mb-10 mt-10">
            {/* Set Statici */}
            <SetupCard 
              char="あ" 
              title="Hiragana" 
              isSelected={selectedSets.includes('hiragana')} 
              onClick={() => { handlePlayClick(); toggleMode('hiragana'); }} 
            />
            <SetupCard 
              char="ア" 
              title="Katakana" 
              isSelected={selectedSets.includes('katakana')} 
              onClick={() => { handlePlayClick(); toggleMode('katakana'); }} 
            />
            
            {/* ⭐ Set "Kanji" (Interruttore Master Virtuale) */}
            <SetupCard 
              char="人" // Icona kanji
              title="Kanji" 
              isSelected={selectedSets.includes('kanji')} // Usa la chiave 'kanji'
              onClick={() => { handlePlayClick(); toggleMode('kanji'); }} // Usa la chiave 'kanji'
            />
          </div>
          
          <div className="w-full max-w-lg mt-4 mb-10">
            <DirectionToggle direction={direction} setDirection={setDirection} onPlayClick={handlePlayClick} />
          </div>
          
          {/* --- Pulsanti Home --- */}
          <div className="flex w-full max-w-sm space-x-2">
            {/* --- Pulsante Modalità Studio --- */}
            <button
              onClick={() => {
                handlePlayClick();
                setShowStudyPanel(true);
              }}
              disabled={available.length === 0}
              className="p-4 rounded-xl transition-all shadow-md bg-gray-200 text-gray-500 hover:bg-gray-300
                         disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
              title="Modalità Studio"
            >
              <StudyIcon />
            </button>

            {/* --- Pulsante Inizia! --- */}
            <button
              onClick={() => {
                handlePlayClick();
                startQuiz();
              }}
              disabled={available.length === 0}
              className="grow bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 transition
                         disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Start!
            </button>
            
            {/* --- Pulsante Modalità a Tempo --- */}
            <button
              onClick={() => {
                handlePlayClick();
                setIsTimedMode(prev => !prev);
              }}
              className={`p-4 rounded-xl transition-all shadow-md
                          ${isTimedMode 
                            ? 'bg-orange-500 text-white shadow-orange-200' 
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
              title={isTimedMode ? "Disattiva Modalità a Tempo" : "Attiva Modalità a Tempo"}
            >
              <StreakIcon />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {available.length} characters {isTimedMode ? '(Blitz Mode Active)' : ''}
          </p>
        </div>

  );
};