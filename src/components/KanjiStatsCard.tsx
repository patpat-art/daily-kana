import React from 'react';
import { getAccuracyStyle } from '../utils/helper'; // Importa lo stile qui

// Definisci le props necessarie per una singola card
interface KanjiStatsCardProps {
    item: {
        char: string;
        accuracy: number | null;
        isAttempted: boolean;
        romajiList?: string;
        readingList?: string;
        stats?: { correct: number; attempts: number };
    };
}

export const KanjiStatsCard: React.FC<KanjiStatsCardProps> = ({ item }) => {
    // Tutta la logica di stile e tooltip è qui, isolata da StatsPanel
    const style = getAccuracyStyle(item.accuracy, item.isAttempted);
    const tooltip = item.isAttempted
        ? `${item.char} (${item.romajiList || item.readingList}): ${item.accuracy?.toFixed(0)}% (${item.stats?.correct}/${item.stats?.attempts})`
        : `${item.char} (${item.romajiList || item.readingList}): Non tentato`;
    
    return (
        <div
            key={item.char}
            className={`p-3 text-center rounded-lg shadow-sm japanese-char 
                        flex items-center justify-center`}
            title={tooltip}
            style={style}
        >
            <div className="text-3xl font-bold">{item.char}</div>
        </div>
    );
};