import React from 'react';
// Importa le icone che ti servono (StudyIcon è nuova)
import { ChartIcon, QuizIcon, SettingsIcon, StudyIcon } from './Icons'; // <-- Aggiungi StudyIcon

// --- Props Aggiornate (molto più semplici) ---
type ActiveView = 'dashboard' | 'quiz' | 'settings' | 'kanjiManager'; // <-- AGGIUNGI 'kanjiManager'

type SidebarProps = {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
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
      title={label} // <-- Il 'title' ora funge da tooltip
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

// --- Componente Sidebar (Sempre Ridotto) ---
export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
}) => {
  return (
    <div
      className={`h-screen bg-white text-gray-800 p-5 flex flex-col border-r border-gray-200 
                  w-20`} // <-- LARGHEZZA FISSA
    >
      <nav className="flex flex-col space-y-2">
        {/* 1. Pratica (Quiz) - ORA IL PRIMO */}
        <NavLink
          label="Pratica"
          icon={<QuizIcon />}
          isActive={activeView === 'quiz'}
          onClick={() => setActiveView('quiz')}
        />

        {/* 2. I Miei Kanji (NUOVA PAGINA) */}
        <NavLink
          label="I Miei Kanji"
          icon={<StudyIcon />}
          isActive={activeView === 'kanjiManager'}
          onClick={() => setActiveView('kanjiManager')}
        />

        {/* 3. Progressi (Dashboard) */}
        <NavLink
          label="Progressi"
          icon={<ChartIcon />}
          isActive={activeView === 'dashboard'}
          onClick={() => setActiveView('dashboard')}
        />
        
        {/* 4. Impostazioni (Settings) */}
        <NavLink
          label="Impostazioni"
          icon={<SettingsIcon />}
          isActive={activeView === 'settings'}
          onClick={() => setActiveView('settings')}
        />
      </nav>
    </div>
  );
};