import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import _ from 'lodash';
import * as Tone from 'tone'; // Importato Tone.js
import { CHARACTER_SETS } from './data/characters';
// Importiamo i tipi statici (Character)
import type { Character, SessionHistoryItem, SelectionMap, Question, Feedback, MistakeData, StudySet, LibraryKanji, AnyCharacter, DynamicKanjiMap } from './data/characters';
import { getInitialSelectedChars, speak } from './utils/helper';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS } from './data/constants';

// --- Importa Servizi Dinamici e Tipi ---
import { 
  getStudySets, 
  getKanjiForSet, 
} from './services/kanjiService'; 

// --- Importa Componenti Schermo/Pannelli ---
import { StatsScreen } from './screens/StatsScreen'; 
import { StudyPanel } from './components/StudyPanel'; 
import { HomeScreen } from './screens/HomeScreen';
import { QuizScreen } from './screens/QuizScreen';

// --- Componente Principale App ---
export default function KanaKanjiTrainer() {
  const [screen, setScreen] = useState<'home' | 'quiz'>('home');
  const [showStudyPanel, setShowStudyPanel] = useState(false);
  
  // 1. STATI PER DATI DINAMICI (I tuoi set da Firebase)
  const [dynamicSets, setDynamicSets] = useState<StudySet[]>([]);
  const [dynamicKanjiMap, setDynamicKanjiMap] = useState<DynamicKanjiMap>({}); 
  const [kanjiLoading, setKanjiLoading] = useState(true); 

  // Mappa di selezione Iniziale (Default)
  const initialSelectionMap = useMemo(() => {
    const initialMap: SelectionMap = {};
    Object.keys(CHARACTER_SETS).forEach((setName: string) => {
      initialMap[setName] = getInitialSelectedChars(setName);
    });
    return initialMap;
  }, []);
  
  // Impostazioni persistenti (usando l'hook localStorage)
  const [selectedSets, setSelectedSets] = useLocalStorage<string[]>(STORAGE_KEYS.SELECTED_SETS, ['hiragana']);
  const [selectionMap, setSelectionMap] = useLocalStorage<SelectionMap>(STORAGE_KEYS.SELECTION_MAP, initialSelectionMap);
  const [direction, setDirection] = useLocalStorage<'charToRomaji' | 'romajiToChar'>(STORAGE_KEYS.DIRECTION, 'charToRomaji');
  const [isAutoSkipEnabled, setIsAutoSkipEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.AUTO_SKIP, true);
  const [isSoundEffectsEnabled, setIsSoundEffectsEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.SOUND_EFFECTS, true);
  const [isSpeechEnabled, setIsSpeechEnabled] = useLocalStorage<boolean>(STORAGE_KEYS.SPEECH, false);
  const [isTimedMode, setIsTimedMode] = useLocalStorage<boolean>(STORAGE_KEYS.TIMED_MODE, false);
  
  // Stati di sessione
  const [, setAnswerMode] = useState<'type' | 'multipleChoice'>('type');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mistakeData, setMistakeData] = useState<MistakeData>({});
  const [sessionStats, setSessionStats] = useLocalStorage(STORAGE_KEYS.SESSION_STATS, { attempts: 0, correct: 0 });
  const [loading, setLoading] = useState(true); // Loading dati persistenti
  
  const [inputState, setInputState] = useState<'typing' | 'correct' | 'incorrect'>('typing');
  const [sessionHistory, setSessionHistory] = useLocalStorage<SessionHistoryItem[]>(STORAGE_KEYS.SESSION_HISTORY, []);
  const [showStats, setShowStats] = useState(false);
  const [cardState, setCardState] = useState<'default' | 'correct' | 'incorrect'>('default');
  
  const [currentStreak, setCurrentStreak] = useLocalStorage<number>(STORAGE_KEYS.CURRENT_STREAK, 0);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const timerRef = useRef<number | null>(null);
  const timerKey = useRef<number>(0);
  
  const [wrongGuesses, setWrongGuesses] = useState<Set<string>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const [sounds] = useState(() => {
    if (typeof window !== 'undefined') {
        return {
            correct: new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.2 }
            }).toDestination(),
            incorrect: new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
            }).toDestination(),
            click: new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.1 }
            }).toDestination()
        };
    }
    return null;
  });

// --- RIMUOVI KANJI STATICI E SANIFICA DATI PERSISTENTI ---
  useEffect(() => {
    const validSetNames = Object.keys(CHARACTER_SETS).filter(name => name !== 'kanji_basic');

    setSelectedSets(currentSets => {
      const cleanSets = currentSets.filter(setName => validSetNames.includes(setName));
      if (currentSets.includes('kanji_basic') && !cleanSets.includes('kanji')) {
        cleanSets.push('kanji');
      }
      if (cleanSets.length === 0 && currentSets.length > 0) {
        return ['hiragana']; 
      }
      return cleanSets;
    });

    setSelectionMap(currentMap => {
      const cleanMap: SelectionMap = {};
      validSetNames.forEach(validName => {
        cleanMap[validName] = currentMap[validName] || initialSelectionMap[validName];
      });
      Object.keys(currentMap).forEach(key => {
        if (!validSetNames.includes(key) && key !== 'kanji_basic') {
          cleanMap[key] = currentMap[key];
        }
      });
      return cleanMap;
    });

    const loadMistakeData = () => {
        try {
            if (typeof window !== 'undefined') {
                const data: MistakeData = {};
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key && key.startsWith('mistake:')) {
                        const char = key.replace('mistake:', '');
                        const item = window.localStorage.getItem(key);
                        if (item) {
                            data[char] = JSON.parse(item);
                        }
                    }
                }
                setMistakeData(data);
            }
        } catch (error) {
            console.log('Nessun dato errore esistente, inizio da zero');
        } finally {
            setLoading(false); 
        }
    };
    loadMistakeData();
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

// --- ⭐ MODIFICA: Logica di caricamento dati divisa ---

// 1. Definiamo la logica di fetch
const fetchAndSetDynamicData = useCallback(async () => {
  try {
      const fetchedSets: StudySet[] = await getStudySets();
      setDynamicSets(fetchedSets); // Aggiorna i set

      const newKanjiMap: DynamicKanjiMap = {};
      const kanjiPromises = fetchedSets.map(async (set) => {
          const kanjiList: LibraryKanji[] = await getKanjiForSet(set.id);
          newKanjiMap[set.id] = kanjiList;
      });

      await Promise.all(kanjiPromises);
      
      setDynamicKanjiMap(newKanjiMap); // Aggiorna la mappa dei kanji

      // ⭐ CORREZIONE BUG (4/2): Pulisci la SelectionMap
      setSelectionMap(currentSelectionMap => {
          const newSelectionMap = { ...currentSelectionMap };
          
          fetchedSets.forEach(set => {
              const setId = set.id;
              const existingSelections = newSelectionMap[setId];
              if (!existingSelections) return; // Nessuna selezione per questo set, salta

              // Crea un Set di ID validi dal nuovo caricamento
              const validKanjiIds = new Set(newKanjiMap[setId].map(k => k.id));
              
              // Filtra le selezioni mantenendo solo quelle valide
              const newSelections = new Set<string>();
              existingSelections.forEach(selectedId => {
                  if (validKanjiIds.has(selectedId)) {
                      newSelections.add(selectedId);
                  }
              });
              
              newSelectionMap[setId] = newSelections;
          });
          
          return newSelectionMap;
      });

  } catch (err) {
      console.error("Errore nel caricamento dei set kanji dinamici:", err);
  }
}, [setSelectionMap]); // Aggiungi setSelectionMap come dipendenza

// 2. Wrapper per il caricamento INIZIALE (con spinner)
const loadDynamicDataWithLoading = useCallback(async () => {
    setKanjiLoading(true);
    await fetchAndSetDynamicData();
    setKanjiLoading(false); 
}, [fetchAndSetDynamicData]);

// 3. Wrapper per il REFRESH (silenzioso, senza spinner)
const refreshDynamicDataSilent = useCallback(async () => {
    await fetchAndSetDynamicData();
}, [fetchAndSetDynamicData]);

// --- Caricamento Set Dinamici (Usa il wrapper con spinner) ---
useEffect(() => {
    if (!loading) { 
        loadDynamicDataWithLoading();
    }
}, [loading, loadDynamicDataWithLoading]); 

// --- Mappa di Caratteri Unificata (Statici + Dinamici) ---
const allCharacterSets = useMemo(() => {
    const mergedSets = { ...CHARACTER_SETS };

    dynamicSets.forEach(set => {
        const kanjiList = dynamicKanjiMap[set.id] || [];
        
        mergedSets[set.id] = kanjiList.map(k => ({
            char: k.char,
            romaji: k.romaji, 
            reading: k.reading,
            meaning: k.meaning,
            type: 'kanji', 
            category: { id: set.id, name: set.name }, 
            id: k.id, 
        } as Character)); // Cast a Character per compatibilità
    });
    
    return mergedSets;
}, [dynamicSets, dynamicKanjiMap]);


// --- Gestione Audio (Invariato) ---
  const initAudio = useCallback(async () => {
    if (!isAudioReady && sounds) {
      await Tone.start();
      setIsAudioReady(true);
      console.log('Audio context started');
    }
  }, [isAudioReady, sounds]);

  const playCorrect = useCallback(() => {
    if (!isAudioReady || !sounds || !isSoundEffectsEnabled) return;
    sounds.correct.triggerAttackRelease('C5', '0.1', Tone.now());
  }, [isAudioReady, sounds, isSoundEffectsEnabled]);

  const playIncorrect = useCallback(() => {
    if (!isAudioReady || !sounds || !isSoundEffectsEnabled) return;
    sounds.incorrect.triggerAttackRelease('C3', '0.1', Tone.now());
  }, [isAudioReady, sounds, isSoundEffectsEnabled]);

  const playClick = useCallback(() => {
    if (!isAudioReady || !sounds || !isSoundEffectsEnabled) return;
    sounds.click.triggerAttackRelease('G5', '0.01', Tone.now());
  }, [isAudioReady, sounds, isSoundEffectsEnabled]);

  const handlePlayClick = useCallback(() => {
    initAudio();
    playClick();
  }, [initAudio, playClick]);


  const saveMistake = useCallback(async (char: string, isCorrect: boolean) => {
    if (typeof window === 'undefined') return;
    const key = `mistake:${char}`;
    let current = mistakeData[char] || { count: 0, lastMistake: null };
    if (!isCorrect) {
      current = { count: current.count + 1, lastMistake: Date.now() };
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(current));
      setMistakeData(prev => ({ ...prev, [char]: current }));
    } catch (error) {
      console.error('Salvataggio dati errore fallito:', error);
    }
  }, [mistakeData]);

  // --- LOGICA DEL QUIZ AGGIORNATA ---
  
  const logAnswer = useCallback(async (charObj: AnyCharacter, attemptedAnswer: string, isCorrect: boolean) => {
      setSessionHistory(prev => [...prev, {
        char: charObj.char,
        isCorrect, 
        answer: attemptedAnswer,
        correct: Array.isArray(charObj.romaji) ? charObj.romaji.join(' / ') : charObj.romaji,
        timestamp: Date.now()
      }]);
      setSessionStats(prev => ({
        attempts: prev.attempts + 1,
        correct: prev.correct + (isCorrect ? 1 : 0)
      }));
      if (isCorrect) {
        setCurrentStreak(prev => prev + 1);
      } else {
        setCurrentStreak(0);
      }
      await saveMistake(charObj.char, isCorrect); 
  }, [saveMistake]);

  const toggleMode = (modeName: string) => {
    setSelectedSets(prev => {
      if (prev.includes(modeName)) {
        return prev.filter(s => s !== modeName);
      } else {
        return [...prev, modeName];
      }
    });
  };

  // Funzione che ottiene i caratteri selezionati (Logica Kanji Master)
  const getAvailableCharacters = useCallback((): AnyCharacter[] => {
    let chars: AnyCharacter[] = [];
    
    // 1. Controlla i set statici (Hiragana/Katakana)
    if (selectedSets.includes('hiragana')) {
      const setChars = allCharacterSets['hiragana'] || [];
      const selectedForSet = selectionMap['hiragana'];
      if (selectedForSet && selectedForSet.size > 0) {
        setChars.forEach((charObj: AnyCharacter) => {
          if (selectedForSet.has(charObj.char)) {
            chars.push(charObj);
          }
        });
      }
    }
    if (selectedSets.includes('katakana')) {
      const setChars = allCharacterSets['katakana'] || [];
      const selectedForSet = selectionMap['katakana'];
      if (selectedForSet && selectedForSet.size > 0) {
        setChars.forEach((charObj: AnyCharacter) => {
          if (selectedForSet.has(charObj.char)) {
            chars.push(charObj);
          }
        });
      }
    }
    
    // 2. Controlla il set virtuale "kanji"
    if (selectedSets.includes('kanji')) {
      // Se "kanji" è attivo, scorri TUTTI i set dinamici
      dynamicSets.forEach(set => {
        const setName = set.id;
        const setChars = allCharacterSets[setName] || []; // Prende i kanji dalla mappa unificata
        const selectedForSet = selectionMap[setName]; // Prende le selezioni individuali
        
        if (selectedForSet && selectedForSet.size > 0) {
          setChars.forEach((charObj: AnyCharacter) => {
            const identifier = 'id' in charObj ? charObj.id : charObj.char;
            if (identifier && selectedForSet.has(identifier as string)) {
              chars.push(charObj);
            }
          });
        }
      });
    }
        
    return chars;
  }, [selectedSets, selectionMap, allCharacterSets, dynamicSets]); 

  // Aggiorna per accettare AnyCharacter
  const selectNextCharacter = useCallback(() => {
    const available = getAvailableCharacters();
    if (available.length === 0) return null;
    
    const appearanceMap: { [key: string]: number } = sessionHistory.reduce((acc: { [key: string]: number }, item) => {
      acc[item.char] = (acc[item.char] || 0) + 1;
      return acc;
    }, {});
    
    let minAppearances = Infinity;
    available.forEach(charObj => {
      const appearances = appearanceMap[charObj.char] || 0;
      if (appearances < minAppearances) {
        minAppearances = appearances;
      }
    });

    const weights = available.map(charObj => {
      const mistakes = mistakeData[charObj.char]?.count || 0;
      const appearances = appearanceMap[charObj.char] || 0;
      const mistakeWeight = Math.pow(2, mistakes);
      let appearanceBias = 1.0;
      if (appearances === minAppearances) {
        appearanceBias = 4.0;
      } else if (appearances === minAppearances + 1) {
        appearanceBias = 2.0;
      }
      return Math.min(mistakeWeight * appearanceBias, 100);
    });
    
    const totalWeight = _.sum(weights);
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (let i = 0; i < available.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return available[i];
      }
    }
    return available[available.length - 1];
  }, [getAvailableCharacters, mistakeData, sessionHistory]); 

  // Aggiorna per accettare AnyCharacter
  const generateMultipleChoiceOptions = (correct: AnyCharacter, allChars: AnyCharacter[]) => {
    const options = [correct];
    const otherChars = allChars.filter(c => c.char !== correct.char);
    const shuffled = _.shuffle(otherChars);
    options.push(...shuffled.slice(0, 3));
    return _.shuffle(options);
  };

  // Aggiorna per accettare AnyCharacter
  const checkAnswer = useCallback((charObj: AnyCharacter, attemptedAnswer: string): Feedback => {
      if (!currentQuestion) return { isCorrect: false, correctAnswer: '' };
      let isCorrect = false;
      let correctAnswer: string;
      
      const romajiData = charObj.romaji;
      const readingData = charObj.reading;

      if (currentQuestion.type === 'charToRomaji') {
        const correctAnswers = Array.isArray(romajiData) 
          ? romajiData.map(ans => ans.toLowerCase()) 
          : [romajiData.toLowerCase()];

        const lowerAttempt = attemptedAnswer.toLowerCase().trim();
        isCorrect = correctAnswers.some(ans => ans === lowerAttempt);
        correctAnswer = Array.isArray(romajiData) ? romajiData.join(' / ') : romajiData;
      } else {
        isCorrect = currentQuestion.correctAnswer === attemptedAnswer;
        correctAnswer = currentQuestion.correctAnswer as string;
      }
      
      let correctReading: string | undefined = undefined;
      if (readingData) {
         correctReading = Array.isArray(readingData) 
           ? readingData.join(' / ') 
           : readingData;
      }
    
    return { isCorrect, correctAnswer, correctReading };
    
}, [currentQuestion]); 

  const generateQuestion = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    const charObj = selectNextCharacter();
    if (!charObj) {
        setScreen('home');
        console.error("Nessun carattere disponibile per la selezione.");
        return;
    }
    
    const charAsCharacter = charObj as Character;
    const allChars = getAvailableCharacters();
    
    const romajiProp = Array.isArray(charObj.romaji) ? charObj.romaji : [charObj.romaji]; 
    const readingProp = Array.isArray(charObj.reading) && charObj.reading.length > 0 ? charObj.reading : [charObj.char]; 
    
    const readingPrompt = readingProp[0]; 

    const currentAnswerMode = direction === 'romajiToChar' ? 'multipleChoice' : 'type'; 
    setAnswerMode(currentAnswerMode); 
    
    let question: Question;

    if (direction === 'charToRomaji') {
      question = {
        prompt: charObj.char,
        correctAnswer: romajiProp.map(r => r.toLowerCase()),
        type: 'charToRomaji',
        charObj: charAsCharacter 
      };
    } else { // romajiToChar
      question = {
        prompt: readingPrompt, 
        correctAnswer: charObj.char,
        type: 'romajiToChar',
        charObj: charAsCharacter, 
        options: generateMultipleChoiceOptions(charAsCharacter, allChars) as Question['options'] 
      };
      if (isSpeechEnabled) {
          speak(readingPrompt); 
      }
    }
    
    setCurrentQuestion(question);
    setUserAnswer('');
    setFeedback(null);
    setInputState('typing');
    setCardState('default');
    timerKey.current += 1;
    setWrongGuesses(new Set()); 
    setSelectedAnswer(null);
    
  }, [direction, selectNextCharacter, getAvailableCharacters, isSpeechEnabled]); 

  // Aggiorna per accettare AnyCharacter
  const handleIncorrectSkip = useCallback((charObj: AnyCharacter, attemptedAnswer: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    logAnswer(charObj, attemptedAnswer, false);
    playIncorrect();
    setInputState('incorrect');
    setCardState('incorrect');
    
    if (isSpeechEnabled && direction === 'charToRomaji') {
      speak(charObj.char);
    }

    const { correctAnswer, correctReading } = checkAnswer(charObj, attemptedAnswer); 
setFeedback({
    isCorrect: false,
    correctAnswer,
    correctReading 
});
    setTimeout(() => {
        generateQuestion();
    }, 800); 
  }, [logAnswer, generateQuestion, isSpeechEnabled, playIncorrect, direction, checkAnswer]); 

  // Aggiorna per accettare AnyCharacter
  const handleCorrectSkip = useCallback((charObj: AnyCharacter, correctAttempt: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    logAnswer(charObj, correctAttempt, true);
    playCorrect();
    setInputState('correct');
    setCardState('correct');
    setFeedback(null);
    
    if (isSpeechEnabled) {
      speak(charObj.char); 
    }

    setTimeout(() => {
        generateQuestion();
    }, 400); 
  }, [logAnswer, generateQuestion, isSpeechEnabled, playCorrect]); 

  // Aggiorna per accettare AnyCharacter
  const handleMultipleChoiceClick = (option: AnyCharacter) => {
  if (wrongGuesses.has(option.char)) return; 

  handlePlayClick();
  setSelectedAnswer(option.char); 

  if (!currentQuestion) return; 

  const isCorrect = option.char === currentQuestion.correctAnswer;

  if (isCorrect) {
    if (timerRef.current) clearTimeout(timerRef.current);
    logAnswer(currentQuestion.charObj, option.char, true);
    playCorrect();
    setCardState('correct');
    if (isSpeechEnabled && option.char) speak(option.char); 
    setTimeout(() => generateQuestion(), 400); 
  } else {
    logAnswer(currentQuestion.charObj, option.char, false);
    playIncorrect();
    setCardState('incorrect');
    setWrongGuesses(prev => new Set(prev).add(option.char));
  }
};

// Timer (Invariato)
useEffect(() => {
  if (isTimedMode && screen === 'quiz' && currentQuestion && !feedback) {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      const isMultipleChoice = currentQuestion && currentQuestion.options;
      
      timerRef.current = window.setTimeout(() => { 
        if (!currentQuestion) return;
        
        if (!isMultipleChoice) {
          handleIncorrectSkip(currentQuestion.charObj, 'timeout');
        }

      }, 2000); 
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimedMode, screen, currentQuestion, feedback, handleIncorrectSkip]);


  const startQuiz = () => {
    initAudio();
    const available = getAvailableCharacters();
    if (available.length === 0) {
      console.error('Per favore seleziona almeno una categoria con caratteri!');
      return;
    }
    // Resetta statistiche
    setCurrentStreak(0);

    setScreen('quiz');
    generateQuestion();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value;
    setUserAnswer(newAnswer);
    const isCharToRomajiTyping = currentQuestion && currentQuestion.type === 'charToRomaji';
    if (!isCharToRomajiTyping || !isAutoSkipEnabled) {
      return;
    }
    const lowerAnswer = newAnswer.toLowerCase().trim();
    const correctAnswers = currentQuestion.correctAnswer as string[]; 
    const charObj = currentQuestion.charObj; 
    
    if (correctAnswers.includes(lowerAnswer)) {
      handleCorrectSkip(charObj, lowerAnswer);
      return;
    }
    const isPrefixOfAnyCorrect = correctAnswers.some(correct => 
      correct.startsWith(lowerAnswer)
    );
    if (!isPrefixOfAnyCorrect && lowerAnswer.length > 0) {
      handleIncorrectSkip(charObj, lowerAnswer);
      return;
    }
    setInputState('typing');
  };
  
  const manualCheckAnswer = () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const { charObj } = currentQuestion; 
    const { isCorrect, correctAnswer, correctReading } = checkAnswer(charObj, userAnswer);
    
    logAnswer(charObj, userAnswer, isCorrect);
    setCardState(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
        playCorrect();
    } else {
        playIncorrect();
    }

    setFeedback({
      isCorrect,
      correctAnswer,
      correctReading
    });
    
    if (isSpeechEnabled) {
      if (direction === 'romajiToChar' && isCorrect) {
        speak(charObj.char);
      } else if (direction === 'charToRomaji') {
        speak(charObj.char);
      }
    }
  };
  
  const nextQuestion = () => {
    handlePlayClick();
    generateQuestion();
  };

  const resetProgress = useCallback(async () => {
    console.warn('Reset progressi avviato.');
    try {
      setSessionStats({ attempts: 0, correct: 0 });
      setSessionHistory([]);
      
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith('mistake:')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      }
      setMistakeData({});
      setSessionStats({ attempts: 0, correct: 0 });
      setSessionHistory([]);
      setCurrentStreak(0);
      console.log('Progressi resettati con successo!');
    } catch (error) {
      console.error('Reset progressi fallito:', error);
    }
  }, [setSessionHistory, setSessionStats, setCurrentStreak]);

  const last10 = sessionHistory.slice(-10);
  const correctInLast10 = last10.filter(item => item.isCorrect).length;
  const progressPercent = last10.length > 0 ? (correctInLast10 / last10.length) * 100 : 0;
  const uniqueCharsSeen = useMemo(() => new Set(sessionHistory.map(item => item.char)).size, [sessionHistory]);

  const progressBarStyle: React.CSSProperties = {
    width: `${progressPercent}%`,
    backgroundColor: progressPercent > 75 ? '#15803d' : (progressPercent > 40 ? '#ca8a04' : '#dc2626')
  };
  
  const inputColorClass = {
      'typing': 'border-gray-300 focus:border-blue-500 text-gray-700',
      'correct': 'border-green-500 ring-4 ring-green-100 text-green-700',
      'incorrect': 'border-red-500 ring-4 ring-red-100 text-red-500 font-bold'
  }[inputState];
  
  const cardBgClass = {
    'default': 'bg-white',
    'correct': 'bg-green-100',
    'incorrect': 'bg-red-100'
  }[cardState];
  
  // Condizione di caricamento UNIFICATA
  if (loading || kanjiLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-xl font-medium text-gray-700">Caricamento...</div>
      </div>
    );
  }

  const available = getAvailableCharacters();
  const isCharToRomajiTyping = currentQuestion && currentQuestion.type === 'charToRomaji';
  const isRomajiToCharMultipleChoice = currentQuestion && currentQuestion.type === 'romajiToChar' && currentQuestion.options;
  
  // Lista di tutti i nomi dei set UNIFICATI (Statici + Dinamici)
  const allSetNames = Object.keys(allCharacterSets); 
  
  return (
    <div className="min-h-screen bg-gray-100 relative overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Noto+Sans+JP:wght@400;700;900&display=swap');
          
          .japanese-char {
            font-family: 'Noto Sans JP', 'Inter', sans-serif;
          }

          @keyframes pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .animate-pop { animation: pop 0.2s ease-out; }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.3s ease-in-out; }

          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          
          /* Animazione per la barra del timer */
          @keyframes shrinkTimer {
            from { width: 100%; }
            to { width: 0%; }
          }
          .animate-timerBar {
            animation: shrinkTimer 2s linear 1;
            animation-fill-mode: forwards;
          }
        `}
      </style>

      {/* Contenitore per le schermate */}
      <div className="relative w-full min-h-screen">

{/* --- Schermata Home --- */}
<HomeScreen
  screen={screen}
  handlePlayClick={handlePlayClick}
  initAudio={initAudio}
  isSoundEffectsEnabled={isSoundEffectsEnabled}
  setIsSoundEffectsEnabled={setIsSoundEffectsEnabled}
  selectedSets={selectedSets}
  toggleMode={toggleMode}
  direction={direction}
  setDirection={setDirection}
  setShowStudyPanel={setShowStudyPanel}
  startQuiz={startQuiz}
  available={available}
  isTimedMode={isTimedMode}
  setIsTimedMode={setIsTimedMode}
  sessionHistory={sessionHistory}
  allSets={allCharacterSets} // Passa la mappa unificata
  visibleSets={selectedSets}

  allSetNames={allSetNames} 

  selectionMap={selectionMap}
  setSelectionMap={setSelectionMap}
  resetProgress={resetProgress}
  isAutoSkipEnabled={isAutoSkipEnabled}
  setIsAutoSkipEnabled={setIsAutoSkipEnabled}
  
  // ⭐ NUOVE PROPS PER SETTINGSSCREEN E KANJIMANAGER
  dynamicSets={dynamicSets}
  dynamicKanjiMap={dynamicKanjiMap}
  refreshDynamicData={refreshDynamicDataSilent} // ⭐ PASSA LA FUNZIONE SILENZIOSA
/>
{/* --- Schermata Quiz --- */}
<div className={`w-full min-h-screen p-4 md:p-8 absolute top-0 left-0
                transition-all duration-500 ease-in-out
                ${screen === 'quiz' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-70'}`}>

  <QuizScreen
    screen={screen}
    handlePlayClick={handlePlayClick}
    setScreen={setScreen}
    setShowStats={setShowStats}
    showStats={showStats}
    currentStreak={currentStreak}
    progressBarStyle={progressBarStyle}
    correctInLast10={correctInLast10}
    last10Length={last10.length}
    uniqueCharsSeen={uniqueCharsSeen}
    sessionStats={sessionStats}
    sessionHistoryLength={sessionHistory.length}
    currentQuestion={currentQuestion}
    timerKey={timerKey.current}
    cardBgClass={cardBgClass}
    cardState={cardState}
    setCardState={setCardState}
    isSpeechEnabled={isSpeechEnabled}
    setIsSpeechEnabled={setIsSoundEffectsEnabled}
    initAudio={initAudio}
    isSoundEffectsEnabled={isSoundEffectsEnabled}
    setIsSoundEffectsEnabled={setIsSoundEffectsEnabled}
    isTimedMode={isTimedMode}
    isCharToRomajiTyping={!!isCharToRomajiTyping}
    feedback={feedback}
    isAutoSkipEnabled={isAutoSkipEnabled}
    nextQuestion={nextQuestion}
    isRomajiToCharMultipleChoice={!!isRomajiToCharMultipleChoice}
    wrongGuesses={wrongGuesses}
    selectedAnswer={selectedAnswer}
    handleMultipleChoiceClick={handleMultipleChoiceClick}
    userAnswer={userAnswer}
    handleInputChange={handleInputChange}
    manualCheckAnswer={manualCheckAnswer}
    inputColorClass={inputColorClass}
    isKanjiQuestion={!!(currentQuestion && currentQuestion.charObj.reading)}
    inputState={inputState}
  />
</div>
{/* --- FINE SCHERMATA QUIZ --- */}

      {/* --- Modali (Pannelli) --- */}
      
      {/* Backdrop per i pannelli */}
      {(showStats || showStudyPanel) && ( 
        <div 
          className="fixed inset-0 bg-black opacity-30 z-40 transition-opacity duration-500 ease-in-out"
          onClick={() => {
            handlePlayClick();
            setShowStats(false);
            setShowStudyPanel(false); 
          }} 
        />
      )}
      
      {/* Pannello Statistiche (Scorrevole) */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 transition-transform duration-500 ease-in-out
                      ${showStats ? 'translate-x-0' : 'translate-x-full'}`}>
        <StatsScreen 
            history={sessionHistory} 
            allSets={allCharacterSets}
            allSetNames={allSetNames}
            dynamicSets={dynamicSets}
            dynamicKanjiMap={dynamicKanjiMap}
            onClose={() => {
              handlePlayClick();
              setShowStats(false);
            }} 
            visibleSets={selectedSets}
            onPlayClick={handlePlayClick}
        />
      </div>

  
      {/* --- NUOVO: Pannello Modalità Studio (Scorrevole) --- */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 transition-transform duration-500 ease-in-out
                      ${showStudyPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <StudyPanel
          onClose={() => {
            setShowStudyPanel(false);
          }}
          visibleSets={selectedSets}
          onPlayClick={handlePlayClick} 
          isSpeechEnabled={isSpeechEnabled}
          allSetNames={allSetNames} 
          setIsSpeechEnabled={setIsSpeechEnabled}
          initAudio={initAudio}
        />
      </div>
 
    </div>
    </div>
  );
}