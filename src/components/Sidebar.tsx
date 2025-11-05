
import React from 'react';
// Assicurati che queste icone esistano o sostituiscile
import { ChartIcon, QuizIcon } from './Icons'; 

type ActiveView = 'dashboard' | 'quiz';

type SidebarProps = {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
};

// --- Componente NavLink (Logica di stile aggiornata) ---
const NavLink: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg text-left transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white' // Lo stato attivo rimane blu/bianco
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600' // <-- MODIFICA
                  }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};

// --- Componente Sidebar (Stile contenitore aggiornato) ---
export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
}) => {
  return (
    // <-- MODIFICA: Sfondo bianco, testo scuro e bordo a destra
    <div className="w-64 h-screen bg-white text-gray-800 p-5 flex flex-col border-r border-gray-200">
      
      {/* <-- MODIFICA: Titolo in blu per abbinarsi */}
      <h1 className="text-2xl font-bold mb-10 text-blue-600">Daily Kana</h1>

      <nav className="flex flex-col space-y-2">
        <NavLink
          label="Progress"
          icon={<ChartIcon />} 
          isActive={activeView === 'dashboard'}
          onClick={() => setActiveView('dashboard')}
        />
        <NavLink
          label="Practice"
          icon={<QuizIcon />} 
          isActive={activeView === 'quiz'}
          onClick={() => setActiveView('quiz')}
        />
      </nav>

      {/* <-- MODIFICA: Testo del footer leggermente più scuro per leggibilità su bianco */}
      <div className="mt-auto text-gray-500 text-xs">
        <p>Versione 1.0.0</p>
      </div>
    </div>
  );
};