import React from 'react';

// Props per DirectionToggle
interface DirectionToggleProps {
  direction: 'charToRomaji' | 'romajiToChar';
  setDirection: React.Dispatch<React.SetStateAction<'charToRomaji' | 'romajiToChar'>>;
  onPlayClick: () => void;
}

// Componente Toggle Direzione
export const DirectionToggle: React.FC<DirectionToggleProps> = ({ direction, setDirection, onPlayClick }) => {
  const isCharToRomaji = direction === 'charToRomaji';
  
  return (
    <div className="w-full max-w-lg p-6 bg-white rounded-xl shadow-lg">
      <div className="relative flex w-full bg-gray-200 rounded-full p-1 cursor-pointer">
        <span
          className={`absolute top-1 bottom-1 w-1/2 bg-blue-600 rounded-full shadow-md
                      transition-all duration-300 ease-out
                      ${isCharToRomaji ? 'transform translate-x-0' : 'transform translate-x-full'}`}
          style={{ width: 'calc(50% - 4px)', left: '2px', right: '2px' }}
        ></span>
        <div
          className={`relative z-10 w-1/2 text-center py-2 rounded-full transition-colors duration-300 japanese-char
                      ${isCharToRomaji ? 'text-white font-semibold' : 'text-gray-600'}`}
          onClick={() => {
            onPlayClick();
            setDirection('charToRomaji');
          }}
        >
          あ → a
        </div>
        <div
          className={`relative z-10 w-1/2 text-center py-2 rounded-full transition-colors duration-300 japanese-char
                      ${!isCharToRomaji ? 'text-white font-semibold' : 'text-gray-600'}`}
          onClick={() => {
            onPlayClick();
            setDirection('romajiToChar');
          }}
        >
          a → あ
        </div>
      </div>
    </div>
  );
};