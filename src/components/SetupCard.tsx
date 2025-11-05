import React from 'react';

// Props per SetupCard
interface SetupCardProps {
  char: string;
  title: string;
  isSelected: boolean;
  onClick: () => void;
}

// Componente Carta Setup
export const SetupCard: React.FC<SetupCardProps> = ({ char, title, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-28 h-28 md:w-64 md:h-64 p-4 md:p-6 flex flex-col justify-between items-center rounded-2xl shadow-lg
                transition-all duration-300 transform
                ${isSelected 
                  ? 'bg-blue-600 text-white shadow-blue-300 scale-105' 
                  : 'bg-white text-gray-800 hover:shadow-xl hover:-translate-y-1'
                }`}
  >
     <div className={`text-5xl md:text-8xl font-bold japanese-char ${isSelected ? 'text-white' : 'text-blue-600'}`}>
      {char}
    </div> 
    <div className="text-lg md:text-3xl font-semibold japanese-char">
      {title}
    </div>
  </button>
);
