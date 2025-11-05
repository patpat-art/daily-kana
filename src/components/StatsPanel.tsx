import React, { useMemo } from 'react';
import type { CharacterSet, Character, SessionHistoryItem, StatsMap } from '../data/characters.ts';
import { COLS_MAP, VOWEL_ROWS_MAP } from '../data/characters.ts';

// --- Pannello Statistiche ---
const getAccuracyMap = (sessionHistory: SessionHistoryItem[]): StatsMap => {
    // CORREZIONE: Assicura che 'acc' sia del tipo corretto (StatsMap)
    return sessionHistory.reduce((acc: StatsMap, item) => {
      const char = item.char;
      if (!acc[char]) {
        // CORREZIONE: Assicura che l'oggetto creato corrisponda a StatsMap
        acc[char] = { char: char, attempts: 0, correct: 0, accuracy: 0 };
      }
      acc[char].attempts += 1;
      if (item.isCorrect) {
        acc[char].correct += 1;
      }
      acc[char].accuracy = acc[char].attempts > 0 ? (acc[char].correct / acc[char].attempts) * 100 : 0;
      return acc;
  }, {}); // Inizializza 'acc' come un oggetto vuoto
};

// Funzione per lo stile gradiente
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const COLORS = {
  RED: { r: 220, g: 38, b: 38 },
  YELLOW: { r: 202, g: 138, b: 4 },
  GREEN: { r: 21, g: 128, b: 61 },
};

const getAccuracyStyle = (accuracy: number | null, isAttempted: boolean): React.CSSProperties => {
  if (!isAttempted || accuracy === null) {
    return { 
      backgroundColor: '#E5E7EB',
      color: '#6B7280'
    };
  }
  let startColor, endColor, t;
  if (accuracy <= 50) {
    t = accuracy / 50;
    startColor = COLORS.RED;
    endColor = COLORS.YELLOW;
  } else {
    t = (accuracy - 50) / 50;
    startColor = COLORS.YELLOW;
    endColor = COLORS.GREEN;
  }
  const r = Math.round(lerp(startColor.r, endColor.r, t));
  const g = Math.round(lerp(startColor.g, endColor.g, t));
  const b = Math.round(lerp(startColor.b, endColor.b, t));
  const solidColor = `rgb(${r}, ${g}, ${b})`;
  const fadedColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
  const textColor = accuracy > 70 ? 'white' : 'black';
  return {
    backgroundImage: `linear-gradient(to top, ${solidColor} ${accuracy}%, ${fadedColor} ${accuracy}%)`,
    color: textColor,
  };
};

// Props per StatsPanel
interface StatsPanelProps {
  history: SessionHistoryItem[];
  allSets: CharacterSet;
  onClose: () => void;
  visibleSets: string[];
  allSetNames: string[];
  onPlayClick: () => void;
}
  
// Pannello Statistiche (Modificato per scorrimento)
export const StatsPanel: React.FC<StatsPanelProps> = ({ history, allSets, onClose, visibleSets }) => {
    const statsMap = useMemo(() => getAccuracyMap(history), [history]);

    const getStatsGridData = (setName: string, charType: string) => {
        const fullSet = allSets[setName];
        if (!fullSet) return { header: [], rows: [] };

        const charsOfType = fullSet.filter(c => c.type === charType);

        // CORREZIONE: Tipo esplicito per gridChars
        const gridChars: { [key: string]: { [key: number]: Character & { stats?: any; isAttempted?: boolean; accuracy?: number | null } } } = charsOfType.reduce((acc: { [key: string]: { [key: number]: any } }, charObj: Character) => {
            const colId = charObj.row;
            const rowId = charObj.col;
            if (!colId || !rowId) return acc;
            if (!acc[colId]) acc[colId] = {};
            
            const stats = statsMap[charObj.char];
            acc[colId][rowId] = {
                ...charObj,
                stats,
                isAttempted: !!stats,
                accuracy: stats ? stats.accuracy : null
            };
            return acc;
        }, {});
        
        const presentCols = COLS_MAP.filter(col => gridChars[col.id]);
        const tableRows = VOWEL_ROWS_MAP.map(row => {
            const chars = presentCols.map(col => {
                return gridChars[col.id]?.[row.id] || null;
            });
            return { id: row.id, label: row.label, chars: chars };
        });
        
        return { header: presentCols, rows: tableRows };
    }; 

    // CORREZIONE: Tipo esplicito per acc
    const allStatsGrouped: { [key: string]: any } = visibleSets.reduce((acc: { [key: string]: any }, setName: string) => {
        if (!allSets[setName]) return acc;
        
        acc[setName] = {}; // Initialize object for this set

        if (['hiragana', 'katakana'].includes(setName)) {
            acc[setName].basic = getStatsGridData(setName, 'basic');
            acc[setName].dakuten = getStatsGridData(setName, 'dakuten');
            acc[setName].handakuten = getStatsGridData(setName, 'handakuten');
        } else {
            acc[setName] = allSets[setName]
                .map((charObj: Character) => {
                    const stats = statsMap[charObj.char];
                    const isAttempted = !!stats;
                    return {
                        ...charObj,
                        stats,
                        isAttempted,
                        accuracy: isAttempted ? stats.accuracy : null,
                        romajiList: Array.isArray(charObj.romaji) ? charObj.romaji.join(' / ') : charObj.romaji,
                    };
                });
        }
        return acc;
    }, {});

    return (
        <div className="bg-white w-full h-full p-6 overflow-y-auto shadow-2xl">
            <div className="flex justify-end mb-6">
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light leading-none">
                    &times;
                </button>
            </div>
            <div className="space-y-8">
                {/* CORREZIONE: Object.entries(allStatsGrouped).map(([setName, data]) */}
                {Object.entries(allStatsGrouped).map(([setName, data]) => (
                    <div key={setName}>
                        <h3 className="text-xl font-semibold capitalize mb-3 border-b pb-2 japanese-char">
                            {setName.replace('_', ' ')}
                        </h3>
                        {['hiragana', 'katakana'].includes(setName) ? (
                            <div className="space-y-6">
                                {/* CORREZIONE: Controlla se data.basic, data.dakuten, etc. esistono */}
                                {data.basic && data.basic.header.length > 0 && <StatsGrid title="Base" gridData={data.basic} />}
                                {data.dakuten && data.dakuten.header.length > 0 && <StatsGrid title="Dakuten" gridData={data.dakuten} />}
                                {data.handakuten && data.handakuten.header.length > 0 && <StatsGrid title="Handakuten" gridData={data.handakuten} />}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {/* CORREZIONE: Assicura che 'data' sia un array prima di chiamare .map */}
                                {Array.isArray(data) && data.map((item: any) => {
            const style = getAccuracyStyle(item.accuracy, item.isAttempted);
            const tooltip = item.isAttempted
                ? `${item.char} (${item.romajiList || item.readingList}): ${item.accuracy.toFixed(0)}% (${item.stats.correct}/${item.stats.attempts})`
                : `${item.char} (${item.romajiList || item.readingList}): Non tentato`;
            return (
                <div
                    key={item.char}
                    className={`p-3 text-center rounded-lg shadow-sm japanese-char 
                                flex items-center justify-center`} // <-- MODIFICA QUI
                    title={tooltip}
                    style={style}
                >
                    <div className="text-3xl font-bold">{item.char}</div>
                    
                    {/* Il div con le statistiche testuali è stato rimosso */}
                    
                </div>
            );
        })}
    </div>
)}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Props per StatsGrid
interface StatsGridProps {
  title: string;
  gridData: {
    header: { id: string; label: string }[];
    rows: { id: number; label: string; chars: (Character & { stats?: any; isAttempted?: boolean; accuracy?: number | null } | null)[] }[];
  };
}

// Componente Griglia per Statistiche
const StatsGrid: React.FC<StatsGridProps> = ({ title, gridData }) => (
    <div>
        <h4 className="text-md font-semibold text-gray-600 mb-2">{title}</h4>
        <div className="flex space-x-1">
            <div className="grow flex flex-col space-y-1">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${gridData.header.length}, minmax(0, 1fr))` }}>
                    {gridData.header.map(col => (
                        <div key={col.id} className="w-full text-center py-1 text-sm font-medium text-gray-500">
                            {col.label}
                        </div>
                    ))}
                </div>
                {gridData.rows.map(row => (
                    <div key={row.id} className="grid" style={{ gridTemplateColumns: `repeat(${gridData.header.length}, minmax(0, 1fr))` }}>
                        {row.chars.map((charData, index) => {
                            if (!charData) {
                                return <div key={`empty-${row.id}-${index}`} className="w-full h-12 bg-gray-50 border border-gray-100 rounded-sm"></div>;
                            }
                            const style = getAccuracyStyle(charData.accuracy ?? null, charData.isAttempted ?? false);
                            const tooltip = charData.isAttempted 
                                ? `${charData.char}: ${charData.accuracy?.toFixed(0)}% (${charData.stats.correct}/${charData.stats.attempts})`
                                : `${charData.char}: Non tentato`;
                            return (
                                <div 
                                    key={charData.char} // CORREZIONE: 'key' è una stringa
                                    className={`w-full h-12 flex items-center justify-center text-xl font-bold rounded-sm border-2 border-white cursor-help japanese-char`}
                                    title={tooltip}
                                    style={style}
                                >
                                    {charData.char}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className="flex flex-col space-y-1" style={{ paddingTop: '28px' }}>
                 {gridData.rows.map(row => (
                     <div key={row.id} className="w-8 h-12 flex items-center justify-center font-bold text-gray-600 text-xs">
                         {row.label.toUpperCase()}
                     </div>
                 ))}
            </div>
        </div>
    </div>
);
