import React, { useState, useCallback, useEffect, useReducer } from 'react';
import './App.css';
import { audioEngine } from './AudioEngine';
import Toolbar from './components/Toolbar';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import VirtualInstrument from './components/VirtualInstrument';
import ProgressBar from './components/ProgressBar';
import EndGameAnimation from './components/EndGameAnimation';
import StartScreen from './components/StartScreen';
import LogRocket from 'logrocket';
LogRocket.init('gwciye/musoplay');  

const initialGameState = {
  currentNoteIndex: 0,
  gamePhase: 'initial',
  completedBars: [false, false, false, false],
  isBarFailing: false,
  barHearts: [4, 4, 4, 4]
};

function gameReducer(state, action) {
    switch (action.type) {
        case 'UPDATE_NOTE_INDEX':
            console.log('UPDATE_NOTE_INDEX reducer:', {
                oldIndex: state.currentNoteIndex,
                newIndex: action.payload,
                fullState: state
            });
            return {
                ...state,
                currentNoteIndex: action.payload
            };
            
        case 'SET_GAME_PHASE':
            return {
                ...state,
                gamePhase: action.payload
            };
            
        case 'RESET_BAR_HEARTS':
            return {
                ...state,
                barHearts: [4, 4, 4, 4]
            };
            
        case 'RESET_COMPLETED_BARS':
            return {
                ...state,
                completedBars: [false, false, false, false]
            };

        case 'UPDATE_COMPLETED_BARS':
            return {
                ...state,
                completedBars: state.completedBars.map((bar, index) => 
                    index === action.barIndex ? action.completed : bar
                )
            };

        case 'WRONG_NOTE':
            return {
                ...state,
                barHearts: state.barHearts.map((hearts, index) => 
                    index === action.barIndex ? hearts - 1 : hearts
                )
            };

        case 'SET_BAR_FAILING':
            return {
                ...state,
                isBarFailing: action.failing
            };

        case 'RESET_GAME_STATE':
              return {
                  ...initialGameState,
                  currentNoteIndex: 0,
                  gamePhase: 'initial',
                  completedBars: [false, false, false, false],
                  isBarFailing: false,
                  barHearts: [4, 4, 4, 4]
              };   
            
        default:
            return state;
    }
}
function App() {
    const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
    
    // Audio-related states - removed unused states
    const [audioFiles, setAudioFiles] = useState([]);
    const [fullTunePath, setFullTunePath] = useState('');
    const [melodyAudio, setMelodyAudio] = useState(null);
    const [fullTuneMelodyAudio, setFullTuneMelodyAudio] = useState(null);
  
    // Inside App component
useEffect(() => {
  // Initialize audio engine on first user interaction
  const initAudio = async () => {
    console.log('Initializing audio engine'); // Add debug log
    await audioEngine.init();
    console.log('Audio engine initialized'); // Add debug log
  };

  const handleInteraction = () => {
    console.log('Touch/click interaction detected'); // Add debug log
    initAudio().catch(error => {
      console.error('Failed to initialize audio:', error);
    });
    document.removeEventListener('touchstart', handleInteraction);
    document.removeEventListener('mousedown', handleInteraction);
  };

  // Add listeners for both touch and mouse events
  document.addEventListener('touchstart', handleInteraction, { passive: false });
  document.addEventListener('mousedown', handleInteraction);

  return () => {
    document.removeEventListener('touchstart', handleInteraction);
    document.removeEventListener('mousedown', handleInteraction);
  };
}, []);

  // Game state and progress
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [gameMode, setGameMode] = useState('initial');
  const [score, setScore] = useState(0);
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [failedBars, setFailedBars] = useState([false, false, false, false]);
  const [currentGameNumber, setCurrentGameNumber] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Sequence and completion tracking
  const [correctSequence, setCorrectSequence] = useState([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [showEndAnimation, setShowEndAnimation] = useState(false);

  // UI and interaction states
  const [isListenPracticeMode, setIsListenPracticeMode] = useState(false);

  useEffect(() => {
    const fetchAudioFiles = async () => {
        try {
            const jsonPath = `/assets/audio/testMelodies/game${currentGameNumber}/current.json`;
            console.log('Attempting to fetch JSON from:', jsonPath);
            const response = await fetch(jsonPath);
            const data = await response.json();
            console.log('Loaded audio files:', data);
            setAudioFiles(data.melodyParts);
            setFullTunePath(data.fullTune);
        } catch (error) {
            console.error('Failed to load current.json:', error);
        }
    };

    fetchAudioFiles();
}, [currentGameNumber]);

const notes = [
    { id: 1, color: 'red', noteNumber: 1 },
    { id: 2, color: 'orange', noteNumber: 2 },
    { id: 3, color: 'yellow', noteNumber: 3 },
    { id: 4, color: 'green', noteNumber: 4 },
    { id: 5, color: 'lightblue', noteNumber: 5 },
    { id: 6, color: 'blue', noteNumber: 6 },
    { id: 7, color: 'purple', noteNumber: 7 },
    { id: 8, color: 'red', noteNumber: 8 },
];

// Updated loadAudio function using AudioEngine
const loadAudio = useCallback(async (barIndex) => {
    if (audioFiles.length === 0 || barIndex >= audioFiles.length) {
      return;
    }
  
    const audioPath = audioFiles[barIndex];
    try {
      // Load the melody into the AudioEngine
      await audioEngine.loadSound(audioPath, `melody${barIndex}`);
      // Create an Audio object for compatibility with existing code
      const audio = new Audio(audioPath);
      setMelodyAudio(audio);
      return audio;
    } catch (error) {
      console.error("Failed to load melody audio:", error);
    }
  }, [audioFiles]);
  
  // Keep this useEffect for loading melodies when bar changes
  useEffect(() => {
    if (correctSequence.length > 0) {
      loadAudio(currentBarIndex);
    }
  }, [currentBarIndex, correctSequence, loadAudio]);

// Updated practice mode handler
const handleListenPractice = useCallback(() => {
    if (melodyAudio) {
        // Keep the existing Audio API for melody playback
        melodyAudio.currentTime = 0;
        melodyAudio.play().catch(error => console.error("Audio playback failed:", error));
        
        // Load into AudioEngine for better performance if needed
        audioEngine.loadSound(melodyAudio.src, `practice-melody-${currentBarIndex}`);
    }

    dispatch({ type: 'SET_GAME_PHASE', payload: 'practice' });
    setGameMode('practice');
    setIsListenPracticeMode(true);
}, [melodyAudio, dispatch, currentBarIndex]);

// Updated perform mode handler
const handlePerform = useCallback(() => {
    if (gameState.gamePhase === 'perform') {
        if (melodyAudio) {
            // Keep the existing Audio API for melody playback
            melodyAudio.currentTime = 0;
            melodyAudio.play().catch(error => console.error("Audio playback failed:", error));
        }
    } else {
        dispatch({ type: 'SET_GAME_PHASE', payload: 'perform' });
        setGameMode('play');
        setIsListenPracticeMode(false);
        dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
    }
}, [gameState.gamePhase, melodyAudio, dispatch]);

// Handle viewport height
useEffect(() => {
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
}, []);

// Update body class
useEffect(() => {
    document.body.className = gameMode;
}, [gameMode]);

// Process audio files into sequences
// Keep this effect - it processes the audio files to create note sequences
useEffect(() => {
    if (audioFiles.length > 0) {
        console.log('Processing audio files:', audioFiles);
        
        const sequences = audioFiles.map(filepath => {
            const filename = filepath.split('/').pop();
            const noteSection = filename.split('bar')[1];
            
            const noteSequence = noteSection
                .split('n')
                .slice(1)
                .map(note => note.replace('.mp3', ''));
            
            const processedSequence = noteSequence.map(note => {
                const cleanNote = note.replace('.mp3', '');
                return {
                    number: parseInt(cleanNote.replace('QL', '').replace('QR', ''), 10),
                    isQuaverLeft: cleanNote.includes('QL'),
                    isQuaverRight: cleanNote.includes('QR'),
                    fullNote: cleanNote
                };
            });
            
            return processedSequence;
        });
        
        setCorrectSequence(sequences);
        dispatch({ type: 'RESET_COMPLETED_BARS' });
    }
}, [audioFiles, dispatch]);

useEffect(() => {
    if (!fullTunePath) return;
    const audio = new Audio(fullTunePath);
    setFullTuneMelodyAudio(audio);
}, [fullTunePath]);

// Handle game start
const handleStartGame = () => {
    setShowStartScreen(false);
    setGameMode('initial');
    
    dispatch({ type: 'SET_GAME_PHASE', payload: 'initial' });
    dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
    dispatch({ type: 'RESET_BAR_HEARTS' });
    dispatch({ type: 'RESET_COMPLETED_BARS' });
    dispatch({ type: 'SET_BAR_FAILING', failing: false });
    
    setScore(0);
    setCurrentBarIndex(0);
    setIsGameComplete(false);
    setIsGameEnded(false);
    setShowEndAnimation(false);
    setIsListenPracticeMode(false);
    setFailedBars([false, false, false, false]);
};

// Cleanup effect for audio
useEffect(() => {
    return () => {
        if (melodyAudio) {
            melodyAudio.pause();
            melodyAudio.currentTime = 0;
        }
    };
}, [melodyAudio]);



const moveToNextBar = useCallback((isSuccess = true) => {
    // Clear previous bar audio
    if (melodyAudio) {
      melodyAudio.pause();
      melodyAudio.currentTime = 0;
    }
    
    const handleGameEnd = async () => {
      setIsGameComplete(true);
      setIsGameEnded(true);
      setGameMode('ended');
      setIsListenPracticeMode(false);
      dispatch({ 
        type: 'UPDATE_COMPLETED_BARS', 
        barIndex: currentBarIndex,
        completed: true
      });
      dispatch({ type: 'SET_GAME_PHASE', payload: 'ended' });
  
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowEndAnimation(true);
      if (fullTuneMelodyAudio) {
        fullTuneMelodyAudio.currentTime = 0;
        fullTuneMelodyAudio.play().catch(error => console.error("Audio playback failed:", error));
      }
    };
  
    const handleNextBar = async () => {
      dispatch({ 
        type: 'UPDATE_COMPLETED_BARS', 
        barIndex: currentBarIndex,
        completed: true
      });
  
      if (isSuccess) {
        // Replace uiSounds with AudioEngine
        audioEngine.playBarComplete();
      }
  
      dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
      dispatch({ type: 'SET_GAME_PHASE', payload: 'initial' });
      setGameMode('initial');
      setIsListenPracticeMode(false);
      
      await loadAudio(currentBarIndex + 1);
      setCurrentBarIndex(prev => prev + 1);
    };
  
    const nextBarIndex = currentBarIndex + 1;
    if (nextBarIndex < correctSequence.length) {
      handleNextBar();
    } else {
      handleGameEnd();
    }
  }, [
    currentBarIndex, 
    correctSequence.length,
    fullTuneMelodyAudio,
    melodyAudio,
    dispatch,
    loadAudio
  ]); // Removed uiSounds from dependencies
  
  const handleNextGame = () => {
    if (currentGameNumber >= 3) {
      console.log('All games completed - should redirect to survey');
      return;
    }
  
    // Clear existing audio
    if (melodyAudio) {
      melodyAudio.pause();
      melodyAudio.currentTime = 0;
      setMelodyAudio(null);
    }
  
    if (fullTuneMelodyAudio) {
      fullTuneMelodyAudio.pause();
      fullTuneMelodyAudio.currentTime = 0;
    }
  
    // Reset all state
    setAudioFiles([]);
    setScore(0);
    setCurrentBarIndex(0);
    setFailedBars([false, false, false, false]);
    
    // Reset reducer state
    dispatch({ type: 'RESET_GAME_STATE' });
  
    // Reset game states
    const resetGameStates = () => {
      // Game progression
      setCurrentGameNumber(prev => prev + 1);
      
      // Clear completion states
      setIsGameComplete(false);
      setShowEndAnimation(false);
      setIsGameEnded(false);
      
      // Reset gameplay states
      setScore(0);
      setCurrentBarIndex(0);
      setFailedBars([false, false, false, false]);
      
      // Reset game modes
      setGameMode('initial');
      dispatch({ type: 'SET_GAME_PHASE', payload: 'initial' });
      dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
      dispatch({ type: 'RESET_BAR_HEARTS' });
      dispatch({ type: 'RESET_COMPLETED_BARS' });
      
      // Reset UI states
      setIsListenPracticeMode(false);
    };
  
    resetGameStates();
  };
  const handleNotePlay = useCallback((noteNumber) => {
    console.log('handleNotePlay called with note:', noteNumber); // Debug log
  
    if (gameState.gamePhase !== 'practice' && gameState.gamePhase !== 'perform') {
      console.log('Note ignored - wrong game phase:', gameState.gamePhase);
      return;
    }
  
    // Play note using audio engine
    try {
      audioEngine.playNote(noteNumber);
      console.log('Note played successfully:', noteNumber);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  
    if (gameState.gamePhase === 'perform' && !gameState.isBarFailing) {
      const currentSequence = correctSequence[currentBarIndex];
      const currentNote = currentSequence[gameState.currentNoteIndex];
      
      if (currentNote && noteNumber === currentNote.number) {
        const newNoteIndex = gameState.currentNoteIndex + 1;
        dispatch({ type: 'UPDATE_NOTE_INDEX', payload: newNoteIndex });
  
        if (newNoteIndex === currentSequence.length) {
          const updatedScore = gameState.barHearts[currentBarIndex];
          setScore(prevScore => prevScore + updatedScore);
          moveToNextBar(true);
        }
      } else {
        // Handle wrong note
        const handleWrongNote = async () => {
          dispatch({ type: 'SET_BAR_FAILING', failing: true });
          dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
          dispatch({ type: 'WRONG_NOTE', barIndex: currentBarIndex });
  
          audioEngine.playWrongNote();
  
          if (gameState.barHearts[currentBarIndex] <= 1) {
            setTimeout(() => {
              audioEngine.playBarFailed();
            }, 300);
  
            setTimeout(() => {
              dispatch({ type: 'SET_BAR_FAILING', failing: false });
              moveToNextBar(false);
            }, 1500);
          } else {
            setTimeout(() => {
              dispatch({ type: 'SET_BAR_FAILING', failing: false });
            }, 500);
          }
        };
  
        handleWrongNote();
      }
    }
  }, [
    gameState,
    correctSequence,
    currentBarIndex,
    dispatch,
    moveToNextBar
  ]);
return (
  <div className="game-wrapper">
      {showStartScreen ? (
          <div className="game-container">
              <StartScreen onStartGame={handleStartGame} />
          </div>
      ) : (
          <div className={`game-container ${gameMode}`}>
              <Toolbar onShowInstructions={() => {
                  console.log('Setting showInstructions to true');
                  setShowInstructions(true);
              }} />
              <GameBoard 
                  barHearts={gameState.barHearts} 
                  currentBarIndex={currentBarIndex}
                  renderBar={{
                      correctSequence,
                      currentNoteIndex: gameState.currentNoteIndex,
                      completedBars: gameState.completedBars,
                      isGameComplete,
                      failedBars
                  }}
                  isBarFailed={gameState.isBarFailing}
                  gamePhase={gameState.gamePhase}
              />
              <Controls 
    onListenPractice={handleListenPractice}
    onPerform={handlePerform}
    isListenPracticeMode={isListenPracticeMode}
    isPerformAvailable={true}
    isAudioLoaded={!!melodyAudio}  // Changed to use melodyAudio
    gamePhase={gameState.gamePhase}
/>
              <VirtualInstrument 
                  notes={notes}
                  onNotePlay={handleNotePlay}
                  isGameEnded={isGameEnded}
                  isBarFailing={gameState.isBarFailing}
              />
              <ProgressBar completedBars={gameState.completedBars.filter(Boolean).length} />
              {showEndAnimation && (
                  <EndGameAnimation 
                      score={score} 
                      barHearts={gameState.barHearts} 
                      onNext={handleNextGame}
                      currentGameNumber={currentGameNumber}
                  />
              )}
              {showInstructions && (
                  <div className="instructions-popup">
                      <button className="close-button" onClick={() => setShowInstructions(false)}>
                          ×
                      </button>
                      <div className="instructions-content">
                          <h2>HOW TO PLAY</h2>
                          <div className="instruction-flow">
                              <p>
                                  Press <img 
                                      src="/assets/images/ui/listen-practice.svg" 
                                      alt="Listen & Practice" 
                                      className="inline-button large"
                                  /> to hear the melody, try to find the right notes using the virtual instrument, then when you're ready press <img 
                                      src="/assets/images/ui/perform.svg" 
                                      alt="Perform" 
                                      className="inline-button small"
                                  /> to play the melody for real, but be careful you could lose a <img 
                                      src="/assets/images/ui/heart.svg" 
                                      alt="Heart" 
                                      className="inline-icon"
                                  /> if you make a mistake!
                              </p>
                          </div>
                          <p className="challenge">CAN YOU HIT THE RIGHT NOTES?</p>
                      </div>
                  </div>
              )}
          </div>
      )}
  </div>
);
}

export default App;
