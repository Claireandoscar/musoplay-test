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
  barHearts: [4, 4, 4, 4],
  failedBars: [false, false, false, false]
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

        case 'SET_BAR_FAILED':
            return {
                ...state,
                failedBars: state.failedBars.map((failed, index) => 
                    index === action.barIndex ? action.failed : failed
                )
            };

        case 'RESET_GAME_STATE':
            return {
                ...initialGameState,
                currentNoteIndex: 0,
                gamePhase: 'initial',
                completedBars: [false, false, false, false],
                isBarFailing: false,
                barHearts: [4, 4, 4, 4],
                failedBars: [false, false, false, false]
            };   
            
        default:
            return state;
    }
}
function App() {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  
  // Audio-related states
  const [audioFiles, setAudioFiles] = useState([]);
  const [fullTunePath, setFullTunePath] = useState('');
  const [melodyAudio, setMelodyAudio] = useState(null);
  const [fullTuneMelodyAudio, setFullTuneMelodyAudio] = useState(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  // Game state and progress
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [gameMode, setGameMode] = useState('initial');
  const [score, setScore] = useState(0);
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [currentGameNumber, setCurrentGameNumber] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Sequence and completion tracking
  const [correctSequence, setCorrectSequence] = useState([]);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [isListenPracticeMode, setIsListenPracticeMode] = useState(false);

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

  // Define loadAudio callback - combined version
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

  const preloadAllSounds = async () => {
    const soundsToLoad = [
      // Piano notes
      ...Array.from({ length: 8 }, (_, i) => ({
        url: `/assets/audio/n${i + 1}.mp3`,
        id: `n${i + 1}`
      })),
      // UI sounds
      { url: '/assets/audio/ui-sounds/wrong-note.mp3', id: 'wrong' },
      { url: '/assets/audio/ui-sounds/bar-failed.mp3', id: 'fail' },
      { url: '/assets/audio/ui-sounds/bar-complete.mp3', id: 'complete' },
      { url: '/assets/audio/ui-sounds/note-flip.mp3', id: 'flip' },
      // Add your melody files here when available
      ...audioFiles.map((file, index) => ({
        url: file,
        id: `melody${index}`
      }))
    ];
    
    try {
      const results = await audioEngine.preloadSounds(soundsToLoad);
      console.log('Preload results:', results);
      setIsAudioLoaded(true);
      dispatch({ type: 'SET_GAME_PHASE', payload: 'ready' });
    } catch (error) {
      console.error('Failed to preload sounds:', error);
      setIsAudioLoaded(false);
    }
  };

  useEffect(() => {
    console.log('Audio initialization effect running');
    
    const initAudio = async () => {
        console.log('Initializing audio engine from App.js');
        try {
            const success = await audioEngine.init();
            console.log('AudioEngine init success:', success);
            
            if (success !== false) {
                await preloadAllSounds();  // This handles all sound loading now
                console.log('Audio initialization complete');
            } else {
                console.log('Failed to initialize audio engine');
            }
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            setIsAudioLoaded(false);
        }
    };

    // Try to initialize immediately
    initAudio();

    const handleInteraction = async () => {
        console.log('Touch/click interaction detected');
        await initAudio();
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('mousedown', handleInteraction);
    };

    document.addEventListener('touchstart', handleInteraction, { passive: false });
    document.addEventListener('mousedown', handleInteraction);

    return () => {
        console.log('Cleaning up audio initialization effect');
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('mousedown', handleInteraction);
    };
}, [audioFiles]);  // Note: Dependencies will be needed if you use any state variables in preloadAllSounds


  // Fetch audio files effect
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

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && audioEngine?.audioContext?.state === 'suspended') {
        try {
          await audioEngine.init();
          console.log('AudioEngine reinitialized for virtual piano');
        } catch (error) {
          console.error('Failed to reinitialize AudioEngine:', error);
        }
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check in case page was loaded in background tab
    handleVisibilityChange();
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ... rest of your component code

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
  
  // Handle visibility change - handle both audio types
  const handleVisibilityChange = async () => {
    if (document.hidden) {
      audio.pause();
    } else {
      // Page is visible again - ensure audioEngine is ready
      if (audioEngine && audioEngine.audioContext?.state === 'suspended') {
        try {
          await audioEngine.init();
          console.log('AudioEngine reinitialized after visibility change');
        } catch (error) {
          console.error('Failed to reinitialize AudioEngine:', error);
        }
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  setFullTuneMelodyAudio(audio);

  // Cleanup
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    audio.pause();
  };
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
      try {
        if (audioEngine && typeof audioEngine.playSound === 'function') {
          audioEngine.playSound('success');
        }
      } catch (error) {
        console.log('Could not play success sound:', error);
      }
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
]);

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

const handleNotePlay = useCallback(async (noteNumber) => {
  console.log('handleNotePlay called with note:', noteNumber);

  if (gameState.gamePhase !== 'practice' && gameState.gamePhase !== 'perform') {
    console.log('Note ignored - wrong game phase:', gameState.gamePhase);
    return;
  }

  // Check and resume audio context if needed
  if (audioEngine?.audioContext?.state === 'suspended') {
    try {
      await audioEngine.init();
      console.log('Audio context resumed for note play');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      return;
    }
  }

  // Play note using audio engine
  try {
    console.log('Attempting to play note:', noteNumber);
    audioEngine.playSound(`n${noteNumber}`);
  } catch (error) {
    console.error('Failed to play note:', error);
  }

  // Rest of your existing handleNotePlay code...

  if (gameState.gamePhase === 'perform' && !gameState.isBarFailing) {
    const currentSequence = correctSequence[currentBarIndex];
    const currentNote = currentSequence[gameState.currentNoteIndex];
    
    if (currentNote && noteNumber === currentNote.number) {
      // Handle correct note
      const newNoteIndex = gameState.currentNoteIndex + 1;
      dispatch({ type: 'UPDATE_NOTE_INDEX', payload: newNoteIndex });

      // Check if bar is complete
      if (newNoteIndex === currentSequence.length) {
        try {
          audioEngine.playSound('complete');
        } catch (error) {
          console.error('Failed to play complete sound:', error);
        }
        
        const updatedScore = gameState.barHearts[currentBarIndex];
        setScore(prevScore => prevScore + updatedScore);
        moveToNextBar(true);
      }
    } else {
      // Handle wrong note
      const handleBarFailure = async () => {
        // Play wrong note sound
        try {
          audioEngine.playSound('wrong');
        } catch (error) {
          console.error('Failed to play wrong note sound:', error);
        }

        // Update game state for wrong note
        dispatch({ type: 'SET_BAR_FAILING', failing: true });
        dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
        dispatch({ type: 'WRONG_NOTE', barIndex: currentBarIndex });

        // Check if this was the last heart
        if (gameState.barHearts[currentBarIndex] <= 1) {
          // Add breaking animation to hearts
          const heartElements = document.querySelectorAll('.life-indicator .heart');
          heartElements.forEach(heart => {
            heart.classList.add('breaking');
          });

          // Play fail sound after heart break animation starts
          await new Promise(resolve => setTimeout(resolve, 300));
          try {
            audioEngine.playSound('fail');
          } catch (error) {
            console.error('Failed to play fail sound:', error);
          }

          // Wait for animations to complete
          await new Promise(resolve => setTimeout(resolve, 1200)); // 1500 - 300 = 1200

          // Reset state and move to next bar
          dispatch({ type: 'SET_BAR_FAILING', failing: false });
          dispatch({ 
            type: 'SET_BAR_FAILED', 
            barIndex: currentBarIndex, 
            failed: true 
          });
          moveToNextBar(false);

          // Cleanup animations
          heartElements.forEach(heart => {
            heart.classList.remove('breaking');
          });
        } else {
          // For non-fatal wrong notes, just reset failing state after delay
          setTimeout(() => {
            dispatch({ type: 'SET_BAR_FAILING', failing: false });
          }, 500);
        }
      };

      handleBarFailure().catch(error => {
        console.error('Error in handleBarFailure:', error);
      });
    }
  }
}, [
  gameState,
  correctSequence,
  currentBarIndex,
  dispatch,
  moveToNextBar,
  setScore
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
        failedBars: gameState.failedBars  // Make sure this is added
    }}
    isBarFailed={gameState.isBarFailing}
    gamePhase={gameState.gamePhase}
/>
              <Controls 
    onListenPractice={handleListenPractice}
    onPerform={handlePerform}
    isListenPracticeMode={isListenPracticeMode}
    isPerformAvailable={isAudioLoaded}
    isAudioLoaded={isAudioLoaded}
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
