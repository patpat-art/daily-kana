// (Questo è il NUOVO file HomeScreen)

import React, { useState } from 'react';

// 1. Importa i componenti
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from './Dashboard';
import { HomeQuizScreen } from './HomeQuizScreen';
import { SettingsPanel } from '../components/SettingsPanel';

// 2. Importa i tipi
import type { SessionHistoryItem, CharacterSet, SelectionMap } from '../data/characters.ts';
type Direction = 'charToRomaji' | 'romajiToChar';
type ActiveView = 'dashboard' | 'quiz' | 'settings';

// 3. Definisci le props che questo componente riceve da App.tsx
type HomeScreenProps = {
  screen: 'home' | 'quiz';
  handlePlayClick: () => void;
  initAudio: () => void;
  isSoundEffectsEnabled: boolean;
  setIsSoundEffectsEnabled: (value: React.SetStateAction<boolean>) => void;
  selectedSets: string[];
  toggleMode: (modeName: string) => void;
  direction: Direction;
  setDirection: (value: React.SetStateAction<Direction>) => void;
  setShowStudyPanel: (value: React.SetStateAction<boolean>) => void;
  startQuiz: () => void;
  available: { length: number };
  isTimedMode: boolean;
  setIsTimedMode: (value: React.SetStateAction<boolean>) => void;
  sessionHistory: SessionHistoryItem[];
  allSets: CharacterSet;
  visibleSets: string[];
  selectionMap: SelectionMap;
  setSelectionMap: React.Dispatch<React.SetStateAction<SelectionMap>>;
  resetProgress: () => Promise<void>;
  isAutoSkipEnabled: boolean;
  setIsAutoSkipEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};


export const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  // Stato per la vista attiva, con 'quiz' come default
  const [activeView, setActiveView] = useState<ActiveView>('quiz');

  return (
    // 5. Contenitore principale
    // Gestisce la transizione quando il quiz INIZIA (passando da 'home' a 'quiz' nello stato di App.tsx)
    <div
      className={`flex w-full min-h-screen absolute top-0 left-0
                  transition-all duration-500 ease-in-out
                  ${
                    props.screen === 'quiz'
                      ? '-translate-x-full opacity-70'
                      : 'translate-x-0 opacity-100'
                  }`}
    >
      {/* La Sidebar (sempre ridotta) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* L'UNICA area contenuti. 
          Renderizza una sola vista alla volta. */}
      <main className="flex-1 h-screen overflow-y-auto bg-gray-50">
        
        {/* Vista 1: Pratica (Default) */}
        {activeView === 'quiz' && <HomeQuizScreen {...props} />}

        {/* Vista 2: Progressi */}
        {activeView === 'dashboard' && (
          <Dashboard 
            history={props.sessionHistory}
            allSets={props.allSets}
            visibleSets={props.visibleSets}
          />
        )}

        {/* Vista 3: Impostazioni */}
        {activeView === 'settings' && (
          <SettingsPanel
            selectedModes={props.selectedSets}
            selectionMap={props.selectionMap}
            setSelectionMap={props.setSelectionMap}
            resetProgress={props.resetProgress}
            direction={props.direction}
            isAutoSkipEnabled={props.isAutoSkipEnabled}
            setIsAutoSkipEnabled={props.setIsAutoSkipEnabled}
            onPlayClick={props.handlePlayClick}
          />
        )}
      </main>

      {/* Il blocco <main> duplicato che era qui è stato RIMOSSO. */}

    </div>
  );
};