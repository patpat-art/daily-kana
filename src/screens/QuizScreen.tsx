import React from 'react';
import * as wanakana from 'wanakana';

// 1. IMPORTA I COMPONENTI E LE ICONE CHE USERAI
import { 
  StreakIcon, 
  SoundOnIcon, 
  SoundOffIcon, 
  // SpeechOnIcon,  <- RIMOSSO
  // SpeechOffIcon <- RIMOSSO
} from '../components/Icons';

// 2. IMPORTA I TIPI DI CUI HAI BISOGNO
// (Assumi di aver già definito Character, Question, Feedback in data/characters.ts)
import type { Question, Feedback, AnyCharacter } from '../data/characters';


// 3. DEFINISCI LE PROPS CHE IL COMPONENTE RICEVERÀ DA APP.TSX
// (Questa è la lista di tutto ciò che App.tsx deve "passare" a questo componente)
type QuizScreenProps = {
  screen: 'home' | 'quiz';
  handlePlayClick: () => void;
  setScreen: (screen: 'home' | 'quiz') => void;
  setShowStats: (show: boolean) => void;
  showStats: boolean; // Aggiunto per il testo del pulsante
  currentStreak: number;
  progressBarStyle: React.CSSProperties;
  correctInLast10: number;
  last10Length: number;
  uniqueCharsSeen: number;
  sessionStats: { attempts: number; correct: number };
  sessionHistoryLength: number;
  currentQuestion: Question | null;
  timerKey: number;
  cardBgClass: string;
  cardState: 'default' | 'correct' | 'incorrect';
  setCardState: (state: 'default' | 'correct' | 'incorrect') => void;
  // isSpeechEnabled: boolean; <- RIMOSSO
  // setIsSpeechEnabled: (value: React.SetStateAction<boolean>) => void; <- RIMOSSO
  initAudio: () => void;
  isSoundEffectsEnabled: boolean;
  setIsSoundEffectsEnabled: (value: React.SetStateAction<boolean>) => void;
  isTimedMode: boolean;
  isCharToRomajiTyping: boolean;
  feedback: Feedback | null;
  isAutoSkipEnabled: boolean;
  nextQuestion: () => void;
  isRomajiToCharMultipleChoice: boolean;
  wrongGuesses: Set<string>; // Assicurati che sia un Set
  selectedAnswer: string | null;
  
  // Props per la logica (che creeremo in App.tsx)
  handleMultipleChoiceClick: (option: AnyCharacter) => void; 
  
  // Props per l'input di testo
  userAnswer: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  manualCheckAnswer: () => void;
  inputColorClass: string;
  isKanjiQuestion: boolean;
  inputState: 'typing' | 'correct' | 'incorrect';
};

// 4. CREA IL COMPONENTE
export const QuizScreen: React.FC<QuizScreenProps> = ({
  // 5. "DESTRUTTURA" (RICEVI) TUTTE LE PROPS
  screen,
  handlePlayClick,
  setScreen,
  setShowStats,
  showStats,
  currentStreak,
  progressBarStyle,
  correctInLast10,
  last10Length,
  uniqueCharsSeen,
  sessionStats,
  sessionHistoryLength,
  currentQuestion,
  timerKey,
  cardBgClass,
  cardState,
  setCardState,
  // isSpeechEnabled, <- RIMOSSO
  // setIsSpeechEnabled, <- RIMOSSO
  initAudio,
  isSoundEffectsEnabled,
  setIsSoundEffectsEnabled,
  isTimedMode,
  isCharToRomajiTyping,
  feedback,
  isAutoSkipEnabled,
  nextQuestion,
  isRomajiToCharMultipleChoice,
  wrongGuesses,
  selectedAnswer,
  handleMultipleChoiceClick, // Ricevi la nuova funzione
  userAnswer,
  handleInputChange,
  manualCheckAnswer,
  inputColorClass,
  isKanjiQuestion,
  inputState,
}) => {
  
  // 6. AGGIUNGI IL RETURN
  return (
                <div className={`w-full min-h-screen p-4 md:p-8 absolute top-0 left-0
                                transition-all duration-500 ease-in-out
                                ${screen === 'quiz' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-70'}`}>
                  
                  <div className="max-w-2xl mx-auto">
                    
                    <div className="mb-4 bg-white p-4 rounded-xl shadow-md">
                      <div className="grid grid-cols-3 items-center mb-3">
                        <div className="flex justify-start">
                          <button
                            onClick={() => {
                              handlePlayClick();
                              setScreen('home');
                            }}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
                          >
                            Home
                          </button>
                        </div>
                        
                        <div className="flex justify-center">
                          <div className={`flex items-center font-bold text-lg ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                            <StreakIcon />
                            <span className="ml-1">{currentStreak}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              handlePlayClick();
                              setShowStats(true);
                            }}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition"
                          >
                            {showStats ? 'Nascondi' : 'Stats'}
                          </button>
                        </div>
                      </div>
        
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full transition-all duration-300" style={progressBarStyle}></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                        <span>{correctInLast10} / {last10Length}</span>
                        <span>Seen: {uniqueCharsSeen}</span>
                        <span>Acc: {sessionStats.attempts > 0 ? Math.round((sessionStats.correct / sessionStats.attempts) * 100) : 0}% ({sessionHistoryLength})</span>
                      </div>
                    </div>
                    
                    {currentQuestion && (
                      <div 
                        key={currentQuestion.prompt + timerKey} // Modificata la chiave per forzare il re-render
                        className={`rounded-xl shadow-2xl p-8 transform transition-all duration-300 ${cardBgClass} 
                                    ${cardState === 'correct' ? 'animate-pop' : cardState === 'incorrect' ? 'animate-shake' : 'animate-slideIn'}`}
                        // Resetta lo stato della card dopo l'animazione
                        onAnimationEnd={() => setCardState('default')}
                      >
                        <>
                          <div className="text-center mb-8 relative">
                            <div className="text-sm text-gray-500 mb-4 font-medium h-5">
                              {currentQuestion.type === 'charToRomaji' ? '' : 'Seleziona il carattere corretto'}
                            </div>
                            
                            {/* --- BLOCCO PULSANTE SPEECH RIMOSSO --- */}
                            
                            <div className="absolute top-0 left-0">
                              <button
                                onClick={() => {
                                  initAudio();
                                  setIsSoundEffectsEnabled(prev => !prev);
                                }}
                                className={`p-2 rounded-full transition-colors
                                            ${isSoundEffectsEnabled ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:bg-gray-100'}`}
                                title={isSoundEffectsEnabled ? 'Disattiva audio' : 'Attiva audio'}
                              >
                                {isSoundEffectsEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                              </button>
                            </div>
                            
                            <div className="text-9xl mb-4 font-extrabold text-gray-900 leading-none japanese-char">
                              {currentQuestion.prompt}
                            </div>
                            {currentQuestion.charObj.meaning && currentQuestion.type === 'romajiToChar' && (
                              <div className="text-gray-500 text-sm italic">
                                (Suggerimento: {currentQuestion.charObj.meaning})
                              </div>
                            )}
                          </div>
                          
                          {/* Barra Timer (solo per modalità a digitazione) */}
                          {isTimedMode && isCharToRomajiTyping && !feedback && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 my-4 overflow-hidden">
                              <div
                                key={timerKey}
                                className="h-2.5 bg-orange-500 rounded-full animate-timerBar"
                              ></div>
                            </div>
                          )}
        
                          {/* Feedback per modalità DIGITAZIONE (charToRomaji) */}
                          {isCharToRomajiTyping && feedback && (
                            <div className="text-center">
                              {/* ... feedback per 'corretto' o 'sbagliato' ... */}
                              {feedback.isCorrect && !isAutoSkipEnabled && (
                                  <div className={`text-3xl font-extrabold mb-4 p-2 rounded-lg text-green-600`}>
                                    ✓ Corretto!
                                  </div>
                              )}
{!feedback.isCorrect && (
   <div className="text-xl mb-6 text-gray-700">
     Risposta corretta: 
     <span className="font-bold text-gray-900 japanese-char">
       {feedback.correctReading || feedback.correctAnswer}
     </span>
   </div>
)}
                              
                              {/* Pulsante 'Prossima' solo se non in auto-skip e non in modalità a tempo */}
                              {(!isAutoSkipEnabled && !isTimedMode) && (
                                  <button
                                    onClick={nextQuestion}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg mt-4"
                                    autoFocus
                                  >
                                    Prossima Domanda
                                  </button>
                              )}
                              
                              {((isAutoSkipEnabled || isTimedMode) && !feedback.isCorrect) && <div className="h-16"></div>}
                              {((isAutoSkipEnabled || isTimedMode) && feedback.isCorrect) && <div className="h-16"></div>}
                            </div>
                          )}
                          
                          {/* Opzioni per SCELTA MULTIPLA (romajiToChar) */}
                          {isRomajiToCharMultipleChoice && (
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              {currentQuestion.options?.map((option, idx) => { // Aggiunto '?' opzionale
                                const isWrong = wrongGuesses.has(option.char);
                                const isSelected = selectedAnswer === option.char;
                                
                                let buttonClass = 'border-gray-200 hover:border-blue-300 bg-white';
                                if (isWrong) {
                                  buttonClass = 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed';
                                } else if (isSelected && cardState === 'correct') {
                                  buttonClass = 'border-green-500 bg-green-100 scale-[1.02]';
                                } else if (isSelected && cardState === 'incorrect') {
                                  buttonClass = 'border-red-500 bg-red-100';
                                }
        
                                return (
                                  <button
                                    key={idx}
                                    disabled={isWrong}
                                    onClick={() => handleMultipleChoiceClick(option)}
                                    className={`p-6 md:p-8 text-5xl border-4 rounded-xl transition shadow-md japanese-char
                                      ${buttonClass}
                                    `}
                                  >
                                    {option.char}
                                  </button>
                                );
                              })}
                            </div>
                          )}
        
                          {/* --- BLOCCO INPUT CON LOGICA CONDIZIONALE --- */}
        
{/* CASO 1: È UNA DOMANDA KANJI (Usa il trucco della sovrapposizione) */}
{isCharToRomajiTyping && !feedback && isKanjiQuestion && (
  // Contenitore 'relative' per posizionare l'helper
  <div className="relative w-full mb-6">
    
    {/* 1. L'HELPER VISUALE (SOVRAPPOSTO) */}
    {/* Questo 'div' si siede sopra l'input e mostra l'Hiragana.
        'pointer-events-none' fa sì che i click lo "attraversino"
        e raggiungano l'input sottostante. */}
    <div 
      className={`absolute inset-0 p-4 text-2xl text-center 
                 flex items-center justify-center 
                 japanese-char pointer-events-none
                 font-bold
                 ${inputState === 'incorrect' ? 'text-red-500' : 'text-gray-900'}`}
    >
      {userAnswer.length === 0 
        ? <span className="text-gray-400">Type here...</span> // Placeholder finto
        : <span>{wanakana.toHiragana(userAnswer.toLowerCase(), { isIME: true } as any)}</span>
      }
    </div>

    {/* 2. L'INPUT REALE (SOTTO, TRASPARENTE) */}
    {/* L'utente digita qui. Il testo è trasparente,
        ma il cursore (caret) è forzato a essere visibile. */}
    <input
      type="text"
      value={userAnswer}
      onChange={handleInputChange}
      onKeyPress={(e) => { 
          if (e.key === 'Enter' && (!isAutoSkipEnabled)) { 
              handlePlayClick();
              manualCheckAnswer(); 
          }
      }}
      className={`w-full p-4 text-2xl border-4 rounded-xl text-center 
                  focus:outline-none transition-all duration-200 
                  shadow-inner font-bold ${inputColorClass} 
                  text-transparent caret-gray-900`} // <-- TESTO TRASPARENTE
      autoFocus
      disabled={!!feedback}
      placeholder="" // Placeholder rimosso, lo gestisce l'helper
    />
  </div>
)}

{/* CASO 2: È HIRAGANA/KATAKANA (Usa l'input normale, come prima) */}
{isCharToRomajiTyping && !feedback && !isKanjiQuestion && (
  <input
    type="text"
    value={userAnswer}
    onChange={handleInputChange}
    onKeyPress={(e) => { 
        if (e.key === 'Enter' && (!isAutoSkipEnabled)) { 
            handlePlayClick();
            manualCheckAnswer(); 
        }
    }}
    className={`w-full p-4 text-2xl border-4 rounded-xl mb-6 text-center 
                focus:outline-none transition-all duration-200 
                shadow-inner ${inputColorClass}`}
    placeholder={"Type here..."}
    autoFocus
    disabled={!!feedback}
  />
)}
                          
                          {/* Pulsante "Controlla" per modalità DIGITAZIONE (se non auto-skip) */}
                          {isCharToRomajiTyping && !isAutoSkipEnabled && !isTimedMode && !feedback && (
                              <button
                                onClick={() => {
                                  handlePlayClick();
                                  manualCheckAnswer();
                                }}
                                disabled={!userAnswer.trim()}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
                              >
                                Controlla
                              </button>
                          )}
                        </>
                      </div>
                    )}
                  </div>
                </div>
        
  );
};