import { CHARACTER_SETS, COLS_MAP, VOWEL_ROWS_MAP } from '../data/characters';
import type { Character } from '../data/characters';

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


// --- Funzione Audio ---

export const speak = (text: string) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    console.error('Sintesi vocale non riuscita:', error);
  }
};
