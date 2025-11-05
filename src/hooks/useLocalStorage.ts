import { useState, useEffect } from 'react';
import type { SelectionMap } from '../data/characters.ts';
import { STORAGE_KEYS } from '../data/constants.ts';

// --- Helper per LocalStorage (Hook) ---
// NOTA: Questo hook sostituisce le vecchie funzioni getStoredValue
export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  
  const getStoredValue = (k: string, defaultVal: T): T => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(k);
        if (item) {
          const parsed = JSON.parse(item);
          // Ricostruisce i Set per la selectionMap
          if (key === STORAGE_KEYS.SELECTION_MAP) {
              const mapWithSets: SelectionMap = {};
              for (const mapKey in (parsed as { [key: string]: string[] })) {
                mapWithSets[mapKey] = new Set(parsed[mapKey]);
              }
              return mapWithSets as unknown as T; // Cast a T
          }
          return parsed;
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${k}":`, error);
    }
    return defaultVal;
  };

  const [value, setValue] = useState<T>(() => getStoredValue(key, defaultValue));

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        let valueToStore: string;
        // Serializza i Set per la selectionMap
        if (key === STORAGE_KEYS.SELECTION_MAP) {
            const objToStore: { [key: string]: string[] } = {};
            for (const k in (value as unknown as SelectionMap)) {
                objToStore[k] = Array.from((value as unknown as SelectionMap)[k] as Set<string>);
            }
            valueToStore = JSON.stringify(objToStore);
        } else {
          valueToStore = JSON.stringify(value);
        }
        window.localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

