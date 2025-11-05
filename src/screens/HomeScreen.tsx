import React, { useState } from 'react';

// 1. Importa i componenti
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from './Dashboard';
import { HomeQuizScreen } from './HomeQuizScreen';
import { SettingsPanel } from '../components/SettingsPanel';

// --- MODIFICA 1: Importa il tuo KanjiManager ---
// (Assicurati che il nome file sia corretto e sia in 'src/screens/')
import { KanjiManager } from './KanjiManager'; 

// 2. Importa i tipi
import type { SessionHistoryItem, CharacterSet, SelectionMap } from '../data/characters.ts';
type Direction = 'charToRomaji' | 'romajiToChar';

// --- MODIFICA 2: Aggiungi 'kanjiManager' alla lista delle viste possibili ---
// (Uso 'kanjiManager' come dall'errore, non 'kanji')
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
};


export const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  // Stato per la vista attiva, con 'quiz' come default
  const [activeView, setActiveView] = useState<ActiveView>('quiz');

  // --- SOLUZIONE ERRORE (MODIFICA 3) ---
  // Creiamo una funzione "wrapper" semplice che corrisponde
  // al tipo atteso da Sidebar: (view: ActiveView) => void
  const handleSetActiveView = (view: ActiveView) => {
    setActiveView(view);
  };
  // --- FINE SOLUZIONE ERRORE ---

  return (
    // 5. Contenitore principale
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
        // Ora passiamo la nostra funzione "wrapper"
        setActiveView={handleSetActiveView}
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
            // --- MODIFICA PER MOSTRARE TUTTI I PROGRESSI ---
            // Prima era: visibleSets={props.visibleSets}
            // Ora passiamo le chiavi di *tutti* i set, non solo quelli visibili/selezionati.
            visibleSets={Object.keys(props.allSets)}
          />
        )}

        {/* Vista 3: Impostazioni */}
        {activeView === 'settings' && (
          <SettingsPanel
            selectedModes={props.selectedSets}
            allSetNames={Object.keys(props.allSets)}
            selectionMap={props.selectionMap}
            setSelectionMap={props.setSelectionMap}
            resetProgress={props.resetProgress}
            direction={props.direction}
            isAutoSkipEnabled={props.isAutoSkipEnabled}
            setIsAutoSkipEnabled={props.setIsAutoSkipEnabled}
            onPlayClick={props.handlePlayClick}
          />
        )}

        {/* --- MODIFICA 4: Aggiungi il rendering per KanjiManager --- */}
        {activeView === 'kanjiManager' && (
          <KanjiManager />
        )}

      </main>
    </div>
  );
};