import React, { useMemo, useState } from 'react'; // Importa useState
// Importa i tipi necessari
import type { 
  CharacterSet, 
  Character, 
  SessionHistoryItem, 
  StudySet, 
  DynamicKanjiMap} from '../data/characters.ts';
// Importa i valori necessari
import { COLS_MAP, VOWEL_ROWS_MAP } from '../data/characters.ts';
import { getAccuracyMap, getAccuracyStyle } from '../utils/helper.ts';
import { KanjiStatsCard } from '../components/KanjiStatsCard.tsx';
import { ArrowLeftIcon } from '../components/Icons.tsx';

// Props per Dashboard
interface DashboardProps {
  history: SessionHistoryItem[];
  allSets: CharacterSet; // La mappa unificata
  visibleSets: string[]; 
  allSetNames: string[]; 
  onPlayClick: () => void; 
  
  // Dati separati (necessari per il nuovo layout)
  dynamicSets: StudySet[];
  dynamicKanjiMap: DynamicKanjiMap;
  onClose: () => void; // Aggiunto per compatibilità con HomeScreen
}

// Tipi per la navigazione interna
type MainTab = 'hiragana' | 'katakana' | 'kanji';

// --- Componente Dashboard ---
export const Dashboard: React.FC<DashboardProps> = ({ 
  history, 
  allSets, 
  dynamicSets, 
  dynamicKanjiMap 
}) => {
    
    // --- STATI INTERNI PER LA NAVIGAZIONE ---
    const [activeTab, setActiveTab] = useState<MainTab>('hiragana');
    const [viewingSetId, setViewingSetId] = useState<string | null>(null);

    // 1. STATS MAP (INVARIATO)
    const statsMap = useMemo(() => getAccuracyMap(history), [history]);

    // 2. FUNZIONE HELPER PER GRID STATICHE
    const getStatsGridData = (setName: string, charType: string) => {
        const fullSet = allSets[setName];
        if (!fullSet) return { header: [], rows: [] };

        const charsOfType = fullSet.filter(c => c.type === charType);

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

    // 3. STATS SET STATICI (HIRAGANA/KATAKANA)
    const staticStatsGrouped = useMemo(() => {
      const acc: { [key: string]: any } = {};
      ['hiragana', 'katakana'].forEach(setName => {
        if (!allSets[setName]) return;
        acc[setName] = {};
        acc[setName].basic = getStatsGridData(setName, 'basic');
        acc[setName].dakuten = getStatsGridData(setName, 'dakuten');
        acc[setName].handakuten = getStatsGridData(setName, 'handakuten');
      });
      return acc;
    // Aggiunto statsMap e allSets alle dipendenze
    }, [allSets, statsMap]); 

    // 4. STATS SET DINAMICI (KANJI) - Calcola le medie
    const dynamicSetStats = useMemo(() => {
      return dynamicSets.map(set => {
          const kanjiList = dynamicKanjiMap[set.id] || [];
          
          const statsForSet = kanjiList
            .map(k => statsMap[k.char]) 
            .filter(Boolean); 
          
          const totalAttempts = statsForSet.reduce((sum, s) => sum + s.attempts, 0);
          const totalCorrect = statsForSet.reduce((sum, s) => sum + s.correct, 0);
          const avgAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : null;
          
          const kanjiWithStats = kanjiList.map(k => {
            const stats = statsMap[k.char];
            const isAttempted = !!stats;
            return {
              ...k,
              stats,
              isAttempted,
              accuracy: isAttempted ? stats.accuracy : null,
              romajiList: k.romaji, 
            };
          });

          return { 
            id: set.id, 
            name: set.name, 
            accuracy: avgAccuracy, 
            isAttempted: totalAttempts > 0,
            kanjiList: kanjiWithStats 
          };
        });
    }, [dynamicSets, dynamicKanjiMap, statsMap]);

    
    // --- FUNZIONI DI RENDERIZZAZIONE ---

    // 1. Griglia STATICA (Hiragana/Katakana)
    const renderStaticStats = (setName: 'hiragana' | 'katakana') => {
      const data = staticStatsGrouped[setName];
      // Se non ci sono dati (es. history è vuoto), data sarà definito ma le griglie saranno vuote
      if (!data) return null; 
      
      // ⭐ MODIFICA: Mostra sempre le griglie, anche se vuote (saranno grigie)
      return (
        <div className="space-y-6">
          <StatsGrid title="Base" gridData={data.basic || getStatsGridData(setName, 'basic')} />
          <StatsGrid title="Dakuten" gridData={data.dakuten || getStatsGridData(setName, 'dakuten')} />
          <StatsGrid title="Handakuten" gridData={data.handakuten || getStatsGridData(setName, 'handakuten')} />
        </div>
      );
    };

    // 2. Menu dei Set di KANJI (Mostra Medie)
    const renderKanjiSetMenu = () => {
       // ⭐ MODIFICA: Messaggio più appropriato se non ci sono set
      if (dynamicSetStats.length === 0) {
        return (
          <p className="text-gray-500 text-center p-4">
            Vai su "I Miei Kanji" per creare il tuo primo set di studio.
          </p>
        );
      }
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dynamicSetStats.map((set) => {
              const style = getAccuracyStyle(set.accuracy, set.isAttempted);
              const tooltip = set.isAttempted
                ? `${set.name}: ${set.accuracy?.toFixed(0)}%`
                : `${set.name}: Non ancora praticato`;
              
              return (
                <button
                  key={set.id}
                  onClick={() => setViewingSetId(set.id)}
                  title={tooltip}
                  // Applichiamo lo stile del gradiente direttamente alla card del set
                  style={style}
                  className={`w-full h-36 p-4 flex flex-col items-center justify-center text-xl font-bold rounded-xl
                              transition-all japanese-char shadow-md hover:shadow-lg hover:-translate-y-1`}
                >
                  <span className="text-5xl mb-2">集</span>
                  <span className="text-lg font-semibold capitalize truncate w-full px-2 text-center">{set.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    };

    // 3. Griglia di Dettaglio KANJI (Mostra Stats Individuali)
    const renderKanjiDetailGrid = (setId: string) => {
      const set = dynamicSetStats.find(s => s.id === setId);
      if (!set) return null; // Non dovrebbe succedere

      return (
        <div className="space-y-6">
          <div key={set.id}>
            {/* Header con bottone "Indietro" */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setViewingSetId(null)}
                className="flex items-center text-gray-500 hover:text-blue-600"
              >
                <ArrowLeftIcon />
                <span className="ml-1">Tutti i Set</span>
              </button>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-800 capitalize japanese-char mb-4">{set.name}</h3>
            
            {/* Griglia Densa (come in Settings) */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-y-2">
              {set.kanjiList.map((charObj) => (
                // Usiamo il componente KanjiStatsCard
                <KanjiStatsCard key={charObj.id || charObj.char} item={charObj} />
              ))}
            </div>
          </div>
        </div>
      );
    };

    // --- RENDER PRINCIPALE ---
    
    return (
        // ⭐ MODIFICA: Questo ora è un contenitore di pagina, non un pannello modale
        <div className="w-full p-8">
            <div className="flex justify-between items-center mb-6">
              {/* Titolo Principale */}
              <h1 className="text-4xl font-bold text-gray-800">
                Statistiche
              </h1>
              {/* ⭐ MODIFICA: Bottone Chiudi (X) RIMOSSO */}
            </div>

            {/* Contenitore stile "SettingsPanel" con Tab */}
            <div className="p-6 bg-white rounded-lg shadow-md">
                {/* 1. TAB (Statici) */}
                <div className="flex border-b mb-4">
                  <button
                    key="hiragana"
                    className={`py-2 px-4 capitalize japanese-char ${activeTab === 'hiragana' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => { setActiveTab('hiragana'); setViewingSetId(null); }}
                  >
                    Hiragana
                  </button>
                  <button
                    key="katakana"
                    className={`py-2 px-4 capitalize japanese-char ${activeTab === 'katakana' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => { setActiveTab('katakana'); setViewingSetId(null); }}
                  >
                    Katakana
                  </button>
                  <button
                    key="kanji"
                    className={`py-2 px-4 capitalize japanese-char ${activeTab === 'kanji' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => { setActiveTab('kanji'); }}
                  >
                    Kanji
                  </button>
                </div>

                {/* 2. CONTENUTO TAB (Logica condizionale) */}
                {/* ⭐ MODIFICA: Rimosso il wrapper history.length > 0 */}
                <div className="mt-6">
                  {activeTab === 'hiragana' && renderStaticStats('hiragana')}
                  {activeTab === 'katakana' && renderStaticStats('katakana')}
                  {activeTab === 'kanji' && (
                    viewingSetId ? renderKanjiDetailGrid(viewingSetId) : renderKanjiSetMenu()
                  )}
                </div>
            </div>
        </div>
    );
};

// --- Componenti Interni (StatsGrid) ---

// Props per StatsGrid
interface StatsGridProps {
  title: string;
  gridData: {
    header: { id: string; label: string }[];
    rows: { id: number; label: string; chars: (Character & { stats?: any; isAttempted?: boolean; accuracy?: number | null } | null)[] }[];
  };
}

// Componente Griglia per Statistiche (Kana)
const StatsGrid: React.FC<StatsGridProps> = ({ title, gridData }) => (
    <div>
        <h4 className="text-md font-semibold text-gray-600 mb-2">{title}</h4>
        {/* ⭐ MODIFICA: Aggiunto controllo per griglie vuote */}
        {gridData.header.length === 0 ? (
          <div className="w-full h-12 bg-gray-50 border border-gray-100 rounded-sm flex items-center justify-center">
            <span className="text-gray-400 text-sm">N/A</span>
          </div>
        ) : (
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
                              // Stile e Tooltip per Kana
                              const style = getAccuracyStyle(charData.accuracy ?? null, charData.isAttempted ?? false);
                              const tooltip = charData.isAttempted 
                                  ? `${charData.char}: ${charData.accuracy?.toFixed(0)}% (${charData.stats.correct}/${charData.stats.attempts})`
                                  : `${charData.char}: Non tentato`;
                              return (
                                  <div 
                                      key={charData.char}
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
        )}
    </div>
);