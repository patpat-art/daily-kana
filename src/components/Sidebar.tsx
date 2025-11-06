import React from 'react';
// Importa le icone che ti servono
import { ChartIcon, QuizIcon, SettingsIcon, StudyIcon, SoundOnIcon, SoundOffIcon } from './Icons';

// --- Props Aggiornate ---
type ActiveView = 'dashboard' | 'quiz' | 'settings' | 'kanjiManager'; 

type SidebarProps = {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  // ⭐ NUOVE PROPS PER IL VOLUME
  initAudio: () => void;
  isSoundEffectsEnabled: boolean;
  setIsSoundEffectsEnabled: (value: React.SetStateAction<boolean>) => void;
  handlePlayClick: () => void; 
};

// --- Componente NavLink (Invariato) ---
const NavLink: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center space-x-3 w-full p-3 rounded-lg text-left transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
    >
      {icon}
    </button>
  );
};

// --- Componente Sidebar (Modificato per posizionamento e volume) ---
export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  // ⭐ DESTRUTTURIAMO LE NUOVE PROPS
  initAudio,
  isSoundEffectsEnabled,
  setIsSoundEffectsEnabled,
  handlePlayClick
}) => {
    
    // ⭐ NUOVO COMPONENTE PER IL TOGGLE DEL VOLUME
    const VolumeToggle = () => (
        <button
            onClick={() => {
                handlePlayClick(); // Suona il click
                initAudio();
                setIsSoundEffectsEnabled(prev => !prev);
            }}
            className="flex items-center justify-center w-full p-3 rounded-lg text-left transition-colors
                       text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            title={isSoundEffectsEnabled ? 'Disattiva effetti sonori' : 'Attiva effetti sonori'}
        >
            {isSoundEffectsEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
    );

  return (
    <div
      className={`h-screen bg-white text-gray-800 p-5 flex flex-col border-r border-gray-200 
                  w-20`} 
    >
      
      {/* 1. Navigazione Principale */}
      <nav 
        className="flex flex-col space-y-2 grow"
      >
        {/* ... (Links Principali Invariati) ... */}
        <NavLink
          label="Pratica"
          icon={<QuizIcon />}
          isActive={activeView === 'quiz'}
          onClick={() => setActiveView('quiz')}
        />
        <NavLink
          label="I Miei Kanji"
          icon={<StudyIcon />}
          isActive={activeView === 'kanjiManager'}
          onClick={() => setActiveView('kanjiManager')}
        />
        <NavLink
          label="Progressi"
          icon={<ChartIcon />}
          isActive={activeView === 'dashboard'}
          onClick={() => setActiveView('dashboard')}
        />
      </nav>
      
      {/* 2. Toggle Volume e Impostazioni (Spinto in Basso) */}
      <div className="mt-auto pt-2 border-t border-gray-200 space-y-2">
        
        {/* ⭐ POSIZIONE NUOVA: VOLUME */}
        <VolumeToggle /> 

        {/* Impostazioni */}
        <NavLink
          label="Impostazioni"
          icon={<SettingsIcon />}
          isActive={activeView === 'settings'}
          onClick={() => setActiveView('settings')}
        />
      </div>
      
    </div>
  );
};