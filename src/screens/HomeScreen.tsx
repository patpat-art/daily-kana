import React, { useState } from 'react';

import { Sidebar } from '../components/Sidebar';
import { Dashboard } from './Dashboard';
import { KanjiManager } from './KanjiManager'; 
import { HomeQuizScreen } from './HomeQuizScreen';
import { SettingsPanel } from '../components/SettingsPanel';

// 1. Importa i tipi necessari
import type { SessionHistoryItem, CharacterSet, SelectionMap } from '../data/characters.ts';
type Direction = 'charToRomaji' | 'romajiToChar';

// 2. Definisci il tipo per le viste attive
type ActiveView = 'dashboard' | 'quiz' | 'settings' | 'kanjiManager';

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
  allSetNames: string[]; 
};


export const HomeScreen: React.FC<HomeScreenProps> = (props) => {

  // Stato per la vista attiva, con 'quiz' come default
  const [activeView, setActiveView] = useState<ActiveView>('quiz');

  const handleSetActiveView = (view: ActiveView) => {
    setActiveView(view);
  };

  return (
    // 4. Contenitore principale
    <div
      className={`flex w-full min-h-screen absolute top-0 left-0
                  transition-all duration-500 ease-in-out
                  ${
                    props.screen === 'quiz'
                      ? '-translate-x-full opacity-70'
                      : 'translate-x-0 opacity-100'
                  }`}
    >

      <Sidebar
        activeView={activeView}

        setActiveView={handleSetActiveView}
      />

      <main className="flex-1 h-screen overflow-y-auto bg-gray-50">
        
        {/* Vista 1: Pratica (Default) */}
        {activeView === 'quiz' && <HomeQuizScreen {...props} />}

        {/* Vista 2: Progressi */}
        {activeView === 'dashboard' && (
          <Dashboard 
            history={props.sessionHistory}
            allSets={props.allSets}
            visibleSets={Object.keys(props.allSets)}
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
            allSetNames={props.allSetNames}
          />
        )}

        {/* Vista 4: Gestione Kanji */}
        {activeView === 'kanjiManager' && (
          <KanjiManager />
        )}

      </main>
    </div>
  );
};