// (Questo è il NUOVO file HomeScreen)

import React, { useState } from 'react';

// 1. Importa i nuovi componenti che creeremo
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from './Dashboard'; // Creeremo questo
import { HomeQuizScreen } from './HomeQuizScreen'; // Il tuo vecchio file, rinominato
import type { SessionHistoryItem, CharacterSet } from '../data/characters';

// 2. Importa i tipi necessari (come prima)
type Direction = 'charToRomaji' | 'romajiToChar';

// 3. Definisci le props che questo componente riceve da App.tsx
// (Sono le stesse identiche props del tuo file originale)
type HomeScreenProps = {
  screen: 'home' | 'quiz';
  handlePlayClick: () => void;
  initAudio: () => void;
  isSoundEffectsEnabled: boolean;
  setIsSoundEffectsEnabled: (value: React.SetStateAction<boolean>) => void;
  setShowSettings: (value: React.SetStateAction<boolean>) => void;
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
};

// Definiamo i tipi per le viste della sidebar
type ActiveView = 'dashboard' | 'quiz';

export const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  // 4. Stato per gestire quale vista mostrare nell'area contenuti
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    // 5. Contenitore principale
    // Applichiamo qui la logica di transizione che prima era nel tuo file.
    // L'intero layout (sidebar + contenuti) scivolerà via quando inizia il quiz.
    <div
      className={`flex w-full min-h-screen absolute top-0 left-0
                  transition-all duration-500 ease-in-out
                  ${
                    props.screen === 'quiz'
                      ? '-translate-x-full opacity-70'
                      : 'translate-x-0 opacity-100'
                  }`}
    >
      {/* --- 6. La Sidebar --- */}
      <Sidebar
  activeView={activeView}
  setActiveView={setActiveView}
  isSidebarOpen={isSidebarOpen}
  setIsSidebarOpen={setIsSidebarOpen}
  handlePlayClick={props.handlePlayClick}
  setShowSettings={props.setShowSettings}
  selectedSets={props.selectedSets}
/>

      {/* --- 7. L'area Contenuti --- */}
      <main className="flex-1 h-screen overflow-auto bg-gray-50">
        {/* Renderizziamo la vista "Dashboard" (Progressi) */}
        {/* Renderizziamo la vista "Dashboard" (Progressi) */}
        {activeView === 'dashboard' && (
             <Dashboard 
                 history={props.sessionHistory}
                  allSets={props.allSets}
                  visibleSets={props.visibleSets}
            />
            )}

        {/* Renderizziamo la vista "Quiz Setup" (il tuo vecchio file) */}
        {/* Passiamo tutte le props ricevute da App.tsx */}
        {activeView === 'quiz' && <HomeQuizScreen {...props} />}
      </main>
    </div>
  );
};