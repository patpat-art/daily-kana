import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import _ from 'lodash';
import * as Tone from 'tone'; // Importato Tone.js
import { CHARACTER_SETS } from './data/characters';
import type { Character, SessionHistoryItem, SelectionMap, Question, Feedback, MistakeData } from './data/characters';
import { getInitialSelectedChars, speak } from './utils/helper';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS } from './data/constants';
import { StatsPanel } from './components/StatsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { StudyPanel } from './components/StudyPanel';
import { HomeScreen } from './screens/HomeScreen';
import { HomeQuizScreen } from './screens/HomeQuizScreen';
import { QuizScreen } from './screens/QuizScreen';

// --- Componente Principale App ---
export default function KanaKanjiTrainer() {
  const [screen, setScreen] = useState<'home' | 'quiz'>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [showStudyPanel, setShowStudyPanel] = useState(false);
  
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
  const [, setAnswerMode] = useState<'type' | 'multipleChoice'>('type'); // 'type' è solo per charToRomaji
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null); // Usato solo per modalità type/manual
  const [mistakeData, setMistakeData] = useState<MistakeData>({});
  const [sessionStats, setSessionStats] = useLocalStorage(STORAGE_KEYS.SESSION_STATS, { attempts: 0, correct: 0 });
  const [loading, setLoading] = useState(true);
  
  const [inputState, setInputState] = useState<'typing' | 'correct' | 'incorrect'>('typing');
  const [sessionHistory, setSessionHistory] = useLocalStorage<SessionHistoryItem[]>(STORAGE_KEYS.SESSION_HISTORY, []);
  const [showStats, setShowStats] = useState(false);
  const [cardState, setCardState] = useState<'default' | 'correct' | 'incorrect'>('default');
  
  const [currentStreak, setCurrentStreak] = useLocalStorage<number>(STORAGE_KEYS.CURRENT_STREAK, 0);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const timerRef = useRef<number | null>(null);
  const timerKey = useRef<number>(0);
  
  // CORREZIONE: Tipo esplicito Set<string>
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

// --- Sanificazione Dati Avvio ---
  // Questo useEffect viene eseguito una sola volta al caricamento
  // per pulire dati obsoleti da localStorage.
  useEffect(() => {
    // 1. Definisci la "fonte di verità": le chiavi valide
    const validSetNames = Object.keys(CHARACTER_SETS);

    // 2. Sanifica i 'selectedSets'
    setSelectedSets(currentSets => {
      const cleanSets = currentSets.filter(setName => validSetNames.includes(setName));
      
      // Controllo di sicurezza: se la pulizia rimuove tutto,
      // torna a un default sicuro per evitare un'app vuota.
      if (cleanSets.length === 0 && currentSets.length > 0) {
        console.warn('Dati "selectedSets" obsoleti trovati. Reset a hiragana.');
        return ['hiragana']; // Default sicuro
      }
      return cleanSets;
    });

    // 3. Sanifica la 'selectionMap'
    setSelectionMap(currentMap => {
      let needsCleaning = false;
      const cleanMap: SelectionMap = {};

      // Controlla se la mappa caricata ha chiavi che NON sono in CHARACTER_SETS
      if (Object.keys(currentMap).some(key => !validSetNames.includes(key))) {
        needsCleaning = true;
      }

      if (needsCleaning) {
        console.warn('Dati "selectionMap" obsoleti trovati. Filtro in corso...');
        // Ricostruisci la mappa da zero, usando solo chiavi valide
        validSetNames.forEach(validName => {
          // Mantieni i dati validi se esistono, altrimenti usa l'inizializzazione
          cleanMap[validName] = currentMap[validName] || initialSelectionMap[validName];
        });
        return cleanMap;
      }
      
      // Se non è necessaria la pulizia, restituisci la mappa originale
      return currentMap;
    });
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- L'array vuoto [] assicura che venga eseguito SOLO una volta

// --- Gestione Audio con Tone.js ---
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

  // Caricamento Dati (localStorage per errori)
  useEffect(() => {
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
  }, []);

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

  const logAnswer = useCallback(async (charObj: Character, attemptedAnswer: string, isCorrect: boolean) => {
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
  }, [saveMistake]); // Dipendenza da saveMistake

  const toggleMode = (modeName: string) => {
    setSelectedSets(prev => {
      if (prev.includes(modeName)) {
        return prev.filter(s => s !== modeName);
      } else {
        return [...prev, modeName];
      }
    });
  };

  const getAvailableCharacters = useCallback((): Character[] => {
    let chars: Character[] = [];
    selectedSets.forEach((setName: string) => {
      const setChars = CHARACTER_SETS[setName] || [];
      const selectedForSet = selectionMap[setName];
      if (selectedForSet && selectedForSet.size > 0) {
        setChars.forEach((charObj: Character) => {
          if (selectedForSet.has(charObj.char)) {
            chars.push(charObj);
          }
        });
      }
    });
    
    // Fallback se nessun carattere è selezionato
    if (chars.length === 0) {
       selectedSets.forEach((setName: string) => {
         const setChars = CHARACTER_SETS[setName] || [];
         chars.push(...setChars);
       });
    }
    
    return chars;
  }, [selectedSets, selectionMap]); // Aggiunte dipendenze

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
  }, [getAvailableCharacters, mistakeData, sessionHistory]); // Aggiunte dipendenze

  const generateMultipleChoiceOptions = (correct: Character, allChars: Character[]) => {
    const options = [correct];
    const otherChars = allChars.filter(c => c.char !== correct.char);
    const shuffled = _.shuffle(otherChars);
    options.push(...shuffled.slice(0, 3));
    return _.shuffle(options);
  };

  const checkAnswer = useCallback((_charObj: Character, attemptedAnswer: string): Feedback => {
      if (!currentQuestion) return { isCorrect: false, correctAnswer: '' };
      let isCorrect = false;
      let correctAnswer: string;
      if (currentQuestion.type === 'charToRomaji') {
        const correctAnswers = (currentQuestion.correctAnswer as string[]).map(ans => ans.toLowerCase());
        const lowerAttempt = attemptedAnswer.toLowerCase().trim();
        isCorrect = correctAnswers.some(ans => ans === lowerAttempt);
        correctAnswer = (currentQuestion.correctAnswer as string[]).join(' / ');
      } else {
        isCorrect = currentQuestion.correctAnswer === attemptedAnswer;
        correctAnswer = currentQuestion.correctAnswer as string;
      }
      
      // Ora creiamo il campo 'correctReading' (hiragana)
    let correctReading: string | undefined = undefined;
    
    // Controlliamo se il 'charObj' della domanda corrente HA il campo 'reading'
    if (currentQuestion.charObj.reading) {
       correctReading = Array.isArray(currentQuestion.charObj.reading) 
         ? currentQuestion.charObj.reading.join(' / ') 
         : currentQuestion.charObj.reading;
    }
    
    // Ora restituiamo TUTTO (incluso il nuovo campo)
    return { isCorrect, correctAnswer, correctReading };
    
}, [currentQuestion]); // Aggiunta dipendenza

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
    
    // Determina la modalità risposta
    const currentAnswerMode = direction === 'romajiToChar' ? 'multipleChoice' : 'type'; // 'type' è l'unica altra opzione
    setAnswerMode(currentAnswerMode); // Aggiorna lo stato
    
    let question: Question;
    const allChars = getAvailableCharacters();
    
    if (direction === 'charToRomaji') {
      question = {
        prompt: charObj.char,
        correctAnswer: Array.isArray(charObj.romaji) ? charObj.romaji.map(r => r.toLowerCase()) : [charObj.romaji.toLowerCase()],
        type: 'charToRomaji',
        charObj
      };
    } else { // romajiToChar
      const readings = charObj.reading ? (Array.isArray(charObj.reading) ? charObj.reading : [charObj.reading]) : [];
      const readingPrompt = readings.length > 0 ? readings[0] : ''; // Usa il primo reading

  question = {
    prompt: readingPrompt, // <-- USA IL READING COME PROMPT
    correctAnswer: charObj.char,
    type: 'romajiToChar',
    charObj,
    options: generateMultipleChoiceOptions(charObj, allChars)
  };
      if (isSpeechEnabled) {
          speak(readingPrompt || charObj.char ); // Pronuncia il reading o il carattere
      }
    }
    
    setCurrentQuestion(question);
    setUserAnswer('');
    setFeedback(null);
    setInputState('typing');
    setCardState('default');
    timerKey.current += 1;
    setWrongGuesses(new Set()); // CORREZIONE: Resetta a un Set vuoto
    setSelectedAnswer(null);
    
  }, [direction, selectNextCharacter, getAvailableCharacters, isSpeechEnabled]); // Rimosso 'answerMode'

  const handleIncorrectSkip = useCallback((charObj: Character, attemptedAnswer: string) => {
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

    // CORREZIONE: 'checkAnswer' ora è una dipendenza
    const { correctAnswer, correctReading } = checkAnswer(charObj, attemptedAnswer); 
setFeedback({
    isCorrect: false,
    correctAnswer,
    correctReading 
});
    setTimeout(() => {
        generateQuestion();
    }, 800); 
  }, [logAnswer, generateQuestion, isSpeechEnabled, playIncorrect, direction, checkAnswer]); // Aggiunto checkAnswer

  const handleCorrectSkip = useCallback((charObj: Character, correctAttempt: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    logAnswer(charObj, correctAttempt, true);
    playCorrect();
    setInputState('correct');
    setCardState('correct');
    setFeedback(null);
    
    if (isSpeechEnabled) {
      speak(charObj.char); // Unificato, pronuncia sempre il carattere
    }

    setTimeout(() => {
        generateQuestion();
    }, 400); 
  }, [logAnswer, generateQuestion, isSpeechEnabled, playCorrect]); // Rimosso 'direction'

  const handleMultipleChoiceClick = (option: Character) => {
  if (wrongGuesses.has(option.char)) return; // Già sbagliato

  handlePlayClick();
  setSelectedAnswer(option.char); // Imposta per l'animazione

  if (!currentQuestion) return; // Controllo di sicurezza

  const isCorrect = option.char === currentQuestion.correctAnswer;

  if (isCorrect) {
    // Risposta CORRETTA
    if (timerRef.current) clearTimeout(timerRef.current);
    logAnswer(currentQuestion.charObj, option.char, true);
    playCorrect();
    setCardState('correct');
    if (isSpeechEnabled) speak(option.char);
    // Passa alla prossima domanda
    setTimeout(() => generateQuestion(), 400); 
  } else {
    // Risposta SBAGLIATA
    logAnswer(currentQuestion.charObj, option.char, false);
    playIncorrect();
    setCardState('incorrect');
    setWrongGuesses(prev => new Set(prev).add(option.char));
  }
};

// Timer
useEffect(() => {
  if (isTimedMode && screen === 'quiz' && currentQuestion && !feedback) {

    if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      const isMultipleChoice = currentQuestion && currentQuestion.options;
      
      timerRef.current = window.setTimeout(() => { // Usa window.setTimeout per compatibilità TS
        if (!currentQuestion) return;
        
        if (!isMultipleChoice) {
          handleIncorrectSkip(currentQuestion.charObj, 'timeout');
        }

      }, 2000); // 2 secondi
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
    const correctAnswers = currentQuestion.correctAnswer as string[]; // Cast
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
      setShowSettings(false);
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-xl font-medium text-gray-700">Caricamento...</div>
      </div>
    );
  }

  const available = getAvailableCharacters();
  const isCharToRomajiTyping = currentQuestion && currentQuestion.type === 'charToRomaji';
  const isRomajiToCharMultipleChoice = currentQuestion && currentQuestion.type === 'romajiToChar' && currentQuestion.options;
  
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
          setShowSettings={setShowSettings}
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
          allSets={CHARACTER_SETS}
          visibleSets={selectedSets}
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
    setIsSpeechEnabled={setIsSpeechEnabled}
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
    handleMultipleChoiceClick={handleMultipleChoiceClick} // Passa la nuova funzione
    userAnswer={userAnswer}
    handleInputChange={handleInputChange}
    manualCheckAnswer={manualCheckAnswer}
    inputColorClass={inputColorClass}
  />
</div>
{/* --- FINE SCHERMATA QUIZ --- */}

      {/* --- Modali (Pannelli) --- */}
      
      {/* Backdrop per i pannelli */}
      {(showStats || showSettings || showStudyPanel) && ( // <-- Aggiunto showStudyPanel
        <div 
          className="fixed inset-0 bg-black opacity-30 z-40 transition-opacity duration-500 ease-in-out"
          onClick={() => {
            handlePlayClick();
            setShowStats(false);
            setShowSettings(false);
            setShowStudyPanel(false); // <-- Aggiunto
          }} 
        />
      )}
      
      {/* Pannello Statistiche (Scorrevole) */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 transition-transform duration-500 ease-in-out
                      ${showStats ? 'translate-x-0' : 'translate-x-full'}`}>
        <StatsPanel 
            history={sessionHistory} 
            allSets={CHARACTER_SETS}
            onClose={() => {
              handlePlayClick();
              setShowStats(false);
            }} 
            visibleSets={selectedSets}
            onPlayClick={handlePlayClick}
        />
      </div>

      {/* Pannello Impostazioni (Scorrevole) */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 transition-transform duration-500 ease-in-out
                      ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
        <SettingsPanel
          onClose={() => {
            setShowSettings(false);
          }}
          selectedModes={selectedSets}
          selectionMap={selectionMap}
          setSelectionMap={setSelectionMap}
          resetProgress={resetProgress}
          direction={direction}
          isAutoSkipEnabled={isAutoSkipEnabled}
          setIsAutoSkipEnabled={setIsAutoSkipEnabled}
          onPlayClick={handlePlayClick}
        />
      </div>

      {/* --- NUOVO: Pannello Modalità Studio (Scorrevole) --- */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 transition-transform duration-500 ease-in-out
                      ${showStudyPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <StudyPanel
          onClose={() => {
            // onPlayClick è già nel pannello
            setShowStudyPanel(false);
          }}
          visibleSets={selectedSets}
          onPlayClick={handlePlayClick} // Passa la funzione base
          isSpeechEnabled={isSpeechEnabled}
          setIsSpeechEnabled={setIsSpeechEnabled}
          initAudio={initAudio}
        />
      </div>

    </div>
    </div>
  );
}

