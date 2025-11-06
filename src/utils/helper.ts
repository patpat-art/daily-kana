import { CHARACTER_SETS, COLS_MAP, VOWEL_ROWS_MAP } from '../data/characters';
import type { Character } from '../data/characters';
import type { SessionHistoryItem, StatsMap } from '../data/characters.ts';

// Funzione helper per ottenere i caratteri di base (per l'init)
export const getInitialSelectedChars = (setName: string): Set<string> => {
  if (!CHARACTER_SETS[setName]) return new Set<string>();
  const initialSet = new Set<string>();
  CHARACTER_SETS[setName].forEach((charObj: Character) => {
    if (charObj.type === 'basic') {
      initialSet.add(charObj.char);
    }
  });
  return initialSet;
};

// Funzione per raggruppare i caratteri per la tabella
export const getGridDataForSet = (setName: string, charType: string) => {
    const fullSet = CHARACTER_SETS[setName];
    if (!fullSet) return { header: [], rows: [] };

    const charsOfType = fullSet.filter(c => c.type === charType);

    const gridChars: { [key: string]: { [key: number]: Character } } = charsOfType.reduce((acc: { [key: string]: { [key: number]: Character } }, charObj: Character) => {
        const colId = charObj.row;
        const rowId = charObj.col;
        if (!colId || !rowId) return acc;
        if (!acc[colId]) acc[colId] = {};
        acc[colId][rowId] = charObj;
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


// --- Funzione Audio (Modificata per sicurezza) ---

// ⭐ CORREZIONE CHIAVE: Accetta string | undefined e controlla all'inizio
export const speak = (text: string | undefined) => {
  if (!text || !('speechSynthesis' in window)) return;
  
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    
  } catch (error) {
    console.error('Sintesi vocale non riuscita:', error);
  }
};

// Definizioni di colori e lerp (funzioni base)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const COLORS = {
  RED: { r: 220, g: 38, b: 38 },
  YELLOW: { r: 202, g: 138, b: 4 },
  GREEN: { r: 21, g: 128, b: 61 },
};

// Funzione 1: Calcola la mappa di accuratezza
export const getAccuracyMap = (sessionHistory: SessionHistoryItem[]): StatsMap => {
    return sessionHistory.reduce((acc: StatsMap, item) => {
      const char = item.char;
      if (!acc[char]) {
        acc[char] = { char: char, attempts: 0, correct: 0, accuracy: 0 };
      }
      acc[char].attempts += 1;
      if (item.isCorrect) {
        acc[char].correct += 1;
      }
      acc[char].accuracy = acc[char].attempts > 0 ? (acc[char].correct / acc[char].attempts) * 100 : 0;
      return acc;
  }, {});
};

// Funzione 2: Calcola lo stile CSS in base all'accuratezza
export const getAccuracyStyle = (accuracy: number | null, isAttempted: boolean): React.CSSProperties => {
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