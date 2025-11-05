// src/components/Sidebar.tsx

import React from 'react';
// Importa le icone necessarie
import { ChartIcon, QuizIcon, SettingsIcon } from './Icons';

// --- NUOVA Icona per il Toggle ---
// (Puoi creare un file Icons.tsx separato per questa,
// ma la metto qui per semplicità)
const CollapseIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={`w-6 h-6 transition-transform duration-300 ${
      isOpen ? '' : 'rotate-180'
    }`}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5"
    />
  </svg>
);

// --- NUOVE Props ---
type ActiveView = 'dashboard' | 'quiz';

type SidebarProps = {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: React.SetStateAction<boolean>) => void;
  handlePlayClick: () => void;
  setShowSettings: (value: React.SetStateAction<boolean>) => void;
  selectedSets: string[];
};

// --- Componente NavLink (Modificato) ---
const NavLink: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isSidebarOpen: boolean; // <-- Nuova prop
}> = ({ label, icon, isActive, isSidebarOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg text-left transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }
                  ${
                    !isSidebarOpen ? 'justify-center' : '' // <-- Centra icona
                  }`}
    >
      {icon}
      {isSidebarOpen && <span className="font-medium">{label}</span>}
    </button>
  );
};

// --- Componente Sidebar (Modificato) ---
export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isSidebarOpen,
  setIsSidebarOpen,
  handlePlayClick,
  setShowSettings,
  selectedSets,
}) => {
  return (
    <div
      className={`h-screen bg-white text-gray-800 p-5 flex flex-col border-r border-gray-200 
                  transition-all duration-300 ease-in-out
                  ${isSidebarOpen ? 'w-64' : 'w-20'}`} // <-- LARGHEZZA DINAMICA
    >
      {/* --- NUOVO Header con Pulsante Impostazioni --- */}
      <div className="flex justify-between items-center mb-10">
        {isSidebarOpen && (
          <h1 className="text-2xl font-bold text-blue-600">Daily Kana</h1>
        )}
        
        {/* Pulsante Impostazioni (Spostato qui) */}
        <button
          onClick={() => {
            handlePlayClick();
            setShowSettings(true);
          }}
          className={`text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition
                     disabled:text-gray-300 disabled:cursor-not-allowed
                     ${isSidebarOpen ? '' : 'mx-auto'}`} // Centra se sidebar chiusa
          title="Impostazioni"
          disabled={selectedSets.length === 0}
        >
          <SettingsIcon />
        </button>
      </div>

      {/* --- Navigazione (Aggiornata) --- */}
      <nav className="flex flex-col space-y-2">
        <NavLink
          label="Progressi"
          icon={<ChartIcon />}
          isActive={activeView === 'dashboard'}
          onClick={() => setActiveView('dashboard')}
          isSidebarOpen={isSidebarOpen} // <-- Passa lo stato
        />
        <NavLink
          label="Pratica"
          icon={<QuizIcon />}
          isActive={activeView === 'quiz'}
          onClick={() => setActiveView('quiz')}
          isSidebarOpen={isSidebarOpen} // <-- Passa lo stato
        />
      </nav>

      {/* --- NUOVO Footer con Pulsante Toggle --- */}
      <div className="mt-auto border-t border-gray-200 pt-4">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className={`flex items-center w-full p-3 rounded-lg
                      text-gray-500 hover:bg-gray-100 hover:text-gray-800
                      ${!isSidebarOpen ? 'justify-center' : ''}`}
        >
          <CollapseIcon isOpen={isSidebarOpen} />
          {isSidebarOpen && <span className="font-medium ml-3">Riduci</span>}
        </button>
      </div>
    </div>
  );
};