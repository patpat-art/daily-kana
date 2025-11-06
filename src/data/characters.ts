// --- Tipi di Dati (per TypeScript) ---

// Importiamo i tipi dal servizio KANJI, perché i nostri tipi dinamici dipendono da questi.
// Assicurati che il percorso a 'kanjiService' sia corretto da QUESTO file (data/characters.ts)
// Potrebbe essere '../services/kanjiService'
import type { LibraryKanji, StudySet } from '../services/kanjiService'; 

export type Direction = 'charToRomaji' | 'romajiToChar';

// ⭐ NUOVO TIPO UNIFICATO (usato per i quiz in App.tsx)
// Questo tipo è la fusione di Character statico + LibraryKanji dinamico
export type AnyCharacter = Character | LibraryKanji;

export type Character = {
  char: string;
  romaji: string | string[];
  category: string | { id: string, name: string }; // ⭐ AGGIORNATO per gestire le categorie dinamiche
  row?: string; // ⭐ RESO OPZIONALE (Solo per Hiragana/Katakana)
  col?: number; // ⭐ RESO OPZIONALE (Solo per Hiragana/Katakana)
  type: string;
  meaning?: string;
  reading?: string | string[];
  id?: string; // ⭐ AGGIUNTO id per i kanji dinamici
};

export type CharacterSet = {
  hiragana: Character[];
  katakana: Character[];
  [key: string]: Character[]; // Per accesso dinamico
};

export type Category = {
  id: string;
  name: string;
};

export type CategorySet = {
  hiragana: Category[];
  katakana: Category[];
  [key: string]: Category[]; // Per accesso dinamico
};

export type SelectionMap = {
  [key: string]: Set<string>;
};

// ⭐ AGGIORNAMENTO CHIAVE: Accetta AnyCharacter per i dati unificati
export type Question = {
  prompt: string;
  correctAnswer: string | string[];
  type: 'charToRomaji' | 'romajiToChar';
  charObj: AnyCharacter; // ⭐ USA IL TIPO UNIFICATO
  options?: AnyCharacter[]; // ⭐ USA IL TIPO UNIFICATO
};

export type Feedback = {
  isCorrect: boolean;
  correctAnswer: string;
  correctReading?: string;
};

export type MistakeData = {
  [key: string]: {
    count: number;
    lastMistake: number | null;
  };
};

export type SessionHistoryItem = {
  char: string;
  isCorrect: boolean;
  answer: string;
  correct: string;
  timestamp: number;
};

export type StatsMap = {
  [key: string]: {
    char: string;
    attempts: number;
    correct: number;
    accuracy: number;
  };
};

// --- TIPI DINAMICI SPOSTATI QUI ---
// Questi ora saranno esportati da characters.ts e importati da App.tsx, HomeScreen.tsx, ecc.

// Questo tipo è già importato da kanjiService, quindi lo ri-esportiamo se necessario,
// o semplicemente ci assicuriamo che 'kanjiService' lo esporti correttamente.
// Per sicurezza, lo includiamo qui se 'kanjiService' non esporta i tipi.
export type { StudySet, LibraryKanji };

// Mappa per i kanji dinamici
export type DynamicKanjiMap = {
  [setId: string]: LibraryKanji[];
};

// --- Database dei Caratteri ---
export const CHARACTER_SETS: CharacterSet = {
  hiragana: [
    // Vowels
    { char: 'あ', romaji: 'a', category: 'vowel', row: 'vowel', col: 1, type: 'basic' },
    { char: 'い', romaji: 'i', category: 'vowel', row: 'vowel', col: 2, type: 'basic' },
    { char: 'う', romaji: 'u', category: 'vowel', row: 'vowel', col: 3, type: 'basic' },
    { char: 'え', romaji: 'e', category: 'vowel', row: 'vowel', col: 4, type: 'basic' },
    { char: 'お', romaji: 'o', category: 'vowel', row: 'vowel', col: 5, type: 'basic' },
    // K-series
    { char: 'か', romaji: 'ka', category: 'k-series', row: 'k', col: 1, type: 'basic' },
    { char: 'き', romaji: 'ki', category: 'k-series', row: 'k', col: 2, type: 'basic' },
    { char: 'く', romaji: 'ku', category: 'k-series', row: 'k', col: 3, type: 'basic' },
    { char: 'け', romaji: 'ke', category: 'k-series', row: 'k', col: 4, type: 'basic' },
    { char: 'こ', romaji: 'ko', category: 'k-series', row: 'k', col: 5, type: 'basic' },
    // S-series
    { char: 'さ', romaji: 'sa', category: 's-series', row: 's', col: 1, type: 'basic' },
    { char: 'し', romaji: 'shi', category: 's-series', row: 's', col: 2, type: 'basic' },
    { char: 'す', romaji: 'su', category: 's-series', row: 's', col: 3, type: 'basic' },
    { char: 'せ', romaji: 'se', category: 's-series', row: 's', col: 4, type: 'basic' },
    { char: 'そ', romaji: 'so', category: 's-series', row: 's', col: 5, type: 'basic' },
    // T-series
    { char: 'た', romaji: 'ta', category: 't-series', row: 't', col: 1, type: 'basic' },
    { char: 'ち', romaji: 'chi', category: 't-series', row: 't', col: 2, type: 'basic' },
    { char: 'つ', romaji: 'tsu', category: 't-series', row: 't', col: 3, type: 'basic' },
    { char: 'て', romaji: 'te', category: 't-series', row: 't', col: 4, type: 'basic' },
    { char: 'と', romaji: 'to', category: 't-series', row: 't', col: 5, type: 'basic' },
    // N-series
    { char: 'な', romaji: 'na', category: 'n-series', row: 'n', col: 1, type: 'basic' },
    { char: 'に', romaji: 'ni', category: 'n-series', row: 'n', col: 2, type: 'basic' },
    { char: 'ぬ', romaji: 'nu', category: 'n-series', row: 'n', col: 3, type: 'basic' },
    { char: 'ね', romaji: 'ne', category: 'n-series', row: 'n', col: 4, type: 'basic' },
    { char: 'の', romaji: 'no', category: 'n-series', row: 'n', col: 5, type: 'basic' },
    // H-series
    { char: 'は', romaji: 'ha', category: 'h-series', row: 'h', col: 1, type: 'basic' },
    { char: 'ひ', romaji: 'hi', category: 'h-series', row: 'h', col: 2, type: 'basic' },
    { char: 'ふ', romaji: 'fu', category: 'h-series', row: 'h', col: 3, type: 'basic' },
    { char: 'へ', romaji: 'he', category: 'h-series', row: 'h', col: 4, type: 'basic' },
    { char: 'ほ', romaji: 'ho', category: 'h-series', row: 'h', col: 5, type: 'basic' },
    // M-series
    { char: 'ま', romaji: 'ma', category: 'm-series', row: 'm', col: 1, type: 'basic' },
    { char: 'み', romaji: 'mi', category: 'm-series', row: 'm', col: 2, type: 'basic' },
    { char: 'む', romaji: 'mu', category: 'm-series', row: 'm', col: 3, type: 'basic' },
    { char: 'め', romaji: 'me', category: 'm-series', row: 'm', col: 4, type: 'basic' },
    { char: 'も', romaji: 'mo', category: 'm-series', row: 'm', col: 5, type: 'basic' },
    // Y-series
    { char: 'や', romaji: 'ya', category: 'y-series', row: 'y', col: 1, type: 'basic' },
    { char: 'ゆ', romaji: 'yu', category: 'y-series', row: 'y', col: 3, type: 'basic' },
    { char: 'よ', romaji: 'yo', category: 'y-series', row: 'y', col: 5, type: 'basic' },
    // R-series
    { char: 'ら', romaji: 'ra', category: 'r-series', row: 'r', col: 1, type: 'basic' },
    { char: 'り', romaji: 'ri', category: 'r-series', row: 'r', col: 2, type: 'basic' },
    { char: 'る', romaji: 'ru', category: 'r-series', row: 'r', col: 3, type: 'basic' },
    { char: 'れ', romaji: 're', category: 'r-series', row: 'r', col: 4, type: 'basic' },
    { char: 'ろ', romaji: 'ro', category: 'r-series', row: 'r', col: 5, type: 'basic' },
    // W-series
    { char: 'わ', romaji: 'wa', category: 'w-series', row: 'w', col: 1, type: 'basic' },
    { char: 'を', romaji: 'wo', category: 'w-series', row: 'w', col: 5, type: 'basic' },
    // N
    { char: 'ん', romaji: 'n', category: 'n-consonant', row: 'n-single', col: 1, type: 'basic' },

    // Dakuten
    { char: 'が', romaji: 'ga', category: 'g-series', row: 'g', col: 1, type: 'dakuten' },
    { char: 'ぎ', romaji: 'gi', category: 'g-series', row: 'g', col: 2, type: 'dakuten' },
    { char: 'ぐ', romaji: 'gu', category: 'g-series', row: 'g', col: 3, type: 'dakuten' },
    { char: 'げ', romaji: 'ge', category: 'g-series', row: 'g', col: 4, type: 'dakuten' },
    { char: 'ご', romaji: 'go', category: 'g-series', row: 'g', col: 5, type: 'dakuten' },
    { char: 'ざ', romaji: 'za', category: 'z-series', row: 'z', col: 1, type: 'dakuten' },
    { char: 'じ', romaji: 'ji', category: 'z-series', row: 'z', col: 2, type: 'dakuten' },
    { char: 'ず', romaji: 'zu', category: 'z-series', row: 'z', col: 3, type: 'dakuten' },
    { char: 'ぜ', romaji: 'ze', category: 'z-series', row: 'z', col: 4, type: 'dakuten' },
    { char: 'ぞ', romaji: 'zo', category: 'z-series', row: 'z', col: 5, type: 'dakuten' },
    { char: 'だ', romaji: 'da', category: 'd-series', row: 'd', col: 1, type: 'dakuten' },
    { char: 'ぢ', romaji: 'ji', category: 'd-series', row: 'd', col: 2, type: 'dakuten' },
    { char: 'づ', romaji: 'zu', category: 'd-series', row: 'd', col: 3, type: 'dakuten' },
    { char: 'で', romaji: 'de', category: 'd-series', row: 'd', col: 4, type: 'dakuten' },
    { char: 'ど', romaji: 'do', category: 'd-series', row: 'd', col: 5, type: 'dakuten' },
    { char: 'ば', romaji: 'ba', category: 'b-series', row: 'b', col: 1, type: 'dakuten' },
    { char: 'び', romaji: 'bi', category: 'b-series', row: 'b', col: 2, type: 'dakuten' },
    { char: 'ぶ', romaji: 'bu', category: 'b-series', row: 'b', col: 3, type: 'dakuten' },
    { char: 'べ', romaji: 'be', category: 'b-series', row: 'b', col: 4, type: 'dakuten' },
    { char: 'ぼ', romaji: 'bo', category: 'b-series', row: 'b', col: 5, type: 'dakuten' },
    // Handakuten
    { char: 'ぱ', romaji: 'pa', category: 'p-series', row: 'p', col: 1, type: 'handakuten' },
    { char: 'ぴ', romaji: 'pi', category: 'p-series', row: 'p', col: 2, type: 'handakuten' },
    { char: 'ぷ', romaji: 'pu', category: 'p-series', row: 'p', col: 3, type: 'handakuten' },
    { char: 'ぺ', romaji: 'pe', category: 'p-series', row: 'p', col: 4, type: 'handakuten' },
    { char: 'ぽ', romaji: 'po', category: 'p-series', row: 'p', col: 5, type: 'handakuten' },
  ],
  katakana: [
    // Vowels
    { char: 'ア', romaji: 'a', category: 'vowel', row: 'vowel', col: 1, type: 'basic' },
    { char: 'イ', romaji: 'i', category: 'vowel', row: 'vowel', col: 2, type: 'basic' },
    { char: 'ウ', romaji: 'u', category: 'vowel', row: 'vowel', col: 3, type: 'basic' },
    { char: 'エ', romaji: 'e', category: 'vowel', row: 'vowel', col: 4, type: 'basic' },
    { char: 'オ', romaji: 'o', category: 'vowel', row: 'vowel', col: 5, type: 'basic' },
    // K-series
    { char: 'カ', romaji: 'ka', category: 'k-series', row: 'k', col: 1, type: 'basic' },
    { char: 'キ', romaji: 'ki', category: 'k-series', row: 'k', col: 2, type: 'basic' },
    { char: 'ク', romaji: 'ku', category: 'k-series', row: 'k', col: 3, type: 'basic' },
    { char: 'ケ', romaji: 'ke', category: 'k-series', row: 'k', col: 4, type: 'basic' },
    { char: 'コ', romaji: 'ko', category: 'k-series', row: 'k', col: 5, type: 'basic' },
    // S-series
    { char: 'サ', romaji: 'sa', category: 's-series', row: 's', col: 1, type: 'basic' },
    { char: 'シ', romaji: 'shi', category: 's-series', row: 's', col: 2, type: 'basic' },
    { char: 'ス', romaji: 'su', category: 's-series', row: 's', col: 3, type: 'basic' },
    { char: 'セ', romaji: 'se', category: 's-series', row: 's', col: 4, type: 'basic' },
    { char: 'ソ', romaji: 'so', category: 's-series', row: 's', col: 5, type: 'basic' },
    // T-series
    { char: 'タ', romaji: 'ta', category: 't-series', row: 't', col: 1, type: 'basic' },
    { char: 'チ', romaji: 'chi', category: 't-series', row: 't', col: 2, type: 'basic' },
    { char: 'ツ', romaji: 'tsu', category: 't-series', row: 't', col: 3, type: 'basic' },
    { char: 'テ', romaji: 'te', category: 't-series', row: 't', col: 4, type: 'basic' },
    { char: 'ト', romaji: 'to', category: 't-series', row: 't', col: 5, type: 'basic' },
    // N-series
    { char: 'ナ', romaji: 'na', category: 'n-series', row: 'n', col: 1, type: 'basic' },
    { char: 'ニ', romaji: 'ni', category: 'n-series', row: 'n', col: 2, type: 'basic' },
    { char: 'ヌ', romaji: 'nu', category: 'n-series', row: 'n', col: 3, type: 'basic' },
    { char: 'ネ', romaji: 'ne', category: 'n-series', row: 'n', col: 4, type: 'basic' },
    { char: 'ノ', romaji: 'no', category: 'n-series', row: 'n', col: 5, type: 'basic' },
    // H-series
    { char: 'ハ', romaji: 'ha', category: 'h-series', row: 'h', col: 1, type: 'basic' },
    { char: 'ヒ', romaji: 'hi', category: 'h-series', row: 'h', col: 2, type: 'basic' },
    { char: 'フ', romaji: 'fu', category: 'h-series', row: 'h', col: 3, type: 'basic' },
    { char: 'ヘ', romaji: 'he', category: 'h-series', row: 'h', col: 4, type: 'basic' },
    { char: 'ホ', romaji: 'ho', category: 'h-series', row: 'h', col: 5, type: 'basic' },
    // M-series
    { char: 'マ', romaji: 'ma', category: 'm-series', row: 'm', col: 1, type: 'basic' },
    { char: 'ミ', romaji: 'mi', category: 'm-series', row: 'm', col: 2, type: 'basic' },
    { char: 'ム', romaji: 'mu', category: 'm-series', row: 'm', col: 3, type: 'basic' },
    { char: 'メ', romaji: 'me', category: 'm-series', row: 'm', col: 4, type: 'basic' },
    { char: 'モ', romaji: 'mo', category: 'm-series', row: 'm', col: 5, type: 'basic' },
    // Y-series
    { char: 'ヤ', romaji: 'ya', category: 'y-series', row: 'y', col: 1, type: 'basic' },
    { char: 'ユ', romaji: 'yu', category: 'y-series', row: 'y', col: 3, type: 'basic' },
    { char: 'ヨ', romaji: 'yo', category: 'y-series', row: 'y', col: 5, type: 'basic' },
    // R-series
    { char: 'ラ', romaji: 'ra', category: 'r-series', row: 'r', col: 1, type: 'basic' },
    { char: 'リ', romaji: 'ri', category: 'r-series', row: 'r', col: 2, type: 'basic' },
    { char: 'ル', romaji: 'ru', category: 'r-series', row: 'r', col: 3, type: 'basic' },
    { char: 'レ', romaji: 're', category: 'r-series', row: 'r', col: 4, type: 'basic' },
    { char: 'ロ', romaji: 'ro', category: 'r-series', row: 'r', col: 5, type: 'basic' },
    // W-series
    { char: 'ワ', romaji: 'wa', category: 'w-series', row: 'w', col: 1, type: 'basic' },
    { char: 'ヲ', romaji: 'wo', category: 'w-series', row: 'w', col: 5, type: 'basic' },
    // N
    { char: 'ン', romaji: 'n', category: 'n-consonant', row: 'n-single', col: 1, type: 'basic' },
    
    // Dakuten
    { char: 'ガ', romaji: 'ga', category: 'g-series', row: 'g', col: 1, type: 'dakuten' },
    { char: 'ギ', romaji: 'gi', category: 'g-series', row: 'g', col: 2, type: 'dakuten' },
    { char: 'グ', romaji: 'gu', category: 'g-series', row: 'g', col: 3, type: 'dakuten' },
    { char: 'ゲ', romaji: 'ge', category: 'g-series', row: 'g', col: 4, type: 'dakuten' },
    { char: 'ゴ', romaji: 'go', category: 'g-series', row: 'g', col: 5, type: 'dakuten' },
    { char: 'ザ', romaji: 'za', category: 'z-series', row: 'z', col: 1, type: 'dakuten' },
    { char: 'ジ', romaji: 'ji', category: 'z-series', row: 'z', col: 2, type: 'dakuten' },
    { char: 'ズ', romaji: 'zu', category: 'z-series', row: 'z', col: 3, type: 'dakuten' },
    { char: 'ゼ', romaji: 'ze', category: 'z-series', row: 'z', col: 4, type: 'dakuten' },
    { char: 'ゾ', romaji: 'zo', category: 'z-series', row: 'z', col: 5, type: 'dakuten' },
    { char: 'ダ', romaji: 'da', category: 'd-series', row: 'd', col: 1, type: 'dakuten' },
    { char: 'ヂ', romaji: 'ji', category: 'd-series', row: 'd', col: 2, type: 'dakuten' },
    { char: 'ヅ', romaji: 'zu', category: 'd-series', row: 'd', col: 3, type: 'dakuten' },
    { char: 'デ', romaji: 'de', category: 'd-series', row: 'd', col: 4, type: 'dakuten' },
    { char: 'ド', romaji: 'do', category: 'd-series', row: 'd', col: 5, type: 'dakuten' },
    { char: 'バ', romaji: 'ba', category: 'b-series', row: 'b', col: 1, type: 'dakuten' },
    { char: 'ビ', romaji: 'bi', category: 'b-series', row: 'b', col: 2, type: 'dakuten' },
    { char: 'ブ', romaji: 'bu', category: 'b-series', row: 'b', col: 3, type: 'dakuten' },
    { char: 'ベ', romaji: 'be', category: 'b-series', row: 'b', col: 4, type: 'dakuten' },
    { char: 'ボ', romaji: 'bo', category: 'b-series', row: 'b', col: 5, type: 'dakuten' },
    // Handakuten
    { char: 'パ', romaji: 'pa', category: 'p-series', row: 'p', col: 1, type: 'handakuten' },
    { char: 'ピ', romaji: 'pi', category: 'p-series', row: 'p', col: 2, type: 'handakuten' },
    { char: 'プ', romaji: 'pu', category: 'p-series', row: 'p', col: 3, type: 'handakuten' },
    { char: 'ペ', romaji: 'pe', category: 'p-series', row: 'p', col: 4, type: 'handakuten' },
    { char: 'ポ', romaji: 'po', category: 'p-series', row: 'p', col: 5, type: 'handakuten' },
  ]
  // ⭐ ELIMINATO: kanji_basic[] rimosso da qui
};

// --- Categorie (ora usate solo per il layout delle impostazioni) ---
export const CATEGORIES: CategorySet = {
  hiragana: [
    { id: 'basic', name: 'Base' },
    { id: 'dakuten', name: 'Dakuten' },
    { id: 'handakuten', name: 'Handakuten' },
  ],
  katakana: [
    { id: 'basic', name: 'Base' },
    { id: 'dakuten', name: 'Dakuten' },
    { id: 'handakuten', name: 'Handakuten' },
  ],
  // ⭐ ELIMINATO: kanji_basic[] rimosso da qui
};

// Mappe per la griglia: Colonne (Consonanti) e Righe (Vocali)
export const COLS_MAP = [
    { id: 'n-single', label: 'N' },
    { id: 'w', label: 'W' },
    { id: 'r', label: 'R' },
    { id: 'y', label: 'Y' },
    { id: 'm', label: 'M' },
    { id: 'h', label: 'H' },
    { id: 'n', label: 'N' },
    { id: 't', label: 'T' },
    { id: 's', label: 'S' },
    { id: 'k', label: 'K' },
    { id: 'vowel', label: 'A' },
    // Dakuten/Handakuten
    { id: 'g', label: 'G' },
    { id: 'z', label: 'Z' },
    { id: 'd', label: 'D' },
    { id: 'b', label: 'B' },
    { id: 'p', label: 'P' },
];

export const VOWEL_ROWS_MAP = [
    { id: 1, label: 'a' }, // col: 1
    { id: 2, label: 'i' }, // col: 2
    { id: 3, label: 'u' }, // col: 3
    { id: 4, label: 'e' }, // col: 4
    { id: 5, label: 'o' }, // col: 5
];