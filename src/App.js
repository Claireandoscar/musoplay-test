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
    console.log('LoadAudio called with barIndex:', barIndex);
    console.log('Current audioFiles:', audioFiles);
    
    if (audioFiles.length === 0 || barIndex >= audioFiles.length) {
        console.log('No audio files available or invalid bar index');
        setIsAudioLoaded(false);  // Explicitly set to false
        return;
    }

    try {
        const audioPath = audioFiles[barIndex];
        console.log('Loading audio from path:', audioPath);
        
        // Load into AudioEngine
        await audioEngine.loadSound(audioPath, `melody${barIndex}`);
        
        // Create Audio object
        const audio = new Audio(audioPath);
        setMelodyAudio(audio);
        
        // Explicitly set audio loaded to true
        setIsAudioLoaded(true);
        console.log('Audio successfully loaded, isAudioLoaded set to true');
        
        return audio;
    } catch (error) {
        console.error('Failed to load audio:', error);
        setIsAudioLoaded(false);
        return null;
    }
}, [audioFiles]);

useEffect(() => {
  const loadAllSounds = async () => {
      console.log('Loading all sounds...');
      try {
          // Make sure audio engine is initialized
          await audioEngine.init();
          
          // Load all piano notes (1-8)
          for (let i = 1; i <= 8; i++) {
              await audioEngine.loadSound(`/assets/audio/n${i}.mp3`, `n${i}`);
              console.log(`Loaded note ${i}`);
          }
          
          // Load all UI sounds
          await audioEngine.loadSound('/assets/audio/ui-sounds/wrong-note.mp3', 'wrong');
          await audioEngine.loadSound('/assets/audio/ui-sounds/bar-failed.mp3', 'fail');
          await audioEngine.loadSound('/assets/audio/ui-sounds/bar-complete.mp3', 'complete');
          await audioEngine.loadSound('/assets/audio/ui-sounds/note-flip.mp3', 'flip');

          // If we have melody files, preload them
          if (audioFiles.length > 0) {
              console.log('Preloading melody files...');
              for (let i = 0; i < audioFiles.length; i++) {
                  const audioPath = audioFiles[i];
                  await audioEngine.loadSound(audioPath, `melody${i}`);
                  console.log(`Preloaded melody ${i}`);
              }
              setIsAudioLoaded(true);
          }
          
          console.log('All sounds loaded successfully');
      } catch (error) {
          console.error('Failed to load sounds:', error);
          setIsAudioLoaded(false);
      }
  };

  loadAllSounds();
}, [audioFiles]); // Added audioFiles as dependency

  // Audio initialization effect
  useEffect(() => {
    console.log('Audio initialization effect running');
    
    const initAudio = async () => {
        console.log('Starting initAudio in App.js');
        try {
            // Platform detection
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            console.log('Platform:', isIOS ? 'iOS' : 'Android/Other');

            // Handle user interaction requirement
            const hasInteracted = await new Promise(resolve => {
                const handleInteraction = () => {
                    console.log('User interaction detected');
                    document.removeEventListener('touchstart', handleInteraction);
                    document.removeEventListener('mousedown', handleInteraction);
                    resolve(true);
                };
                
                // Setup event listeners
                document.addEventListener('touchstart', handleInteraction, { passive: false });
                document.addEventListener('mousedown', handleInteraction);
                
                if (document.documentElement.dataset.hasInteracted === 'true') {
                    console.log('Previous interaction detected');
                    resolve(true);
                }
            });

            if (!hasInteracted && !isIOS) {
                console.log('Waiting for user interaction (Android requirement)');
                return;
            }

            // Audio initialization
            if (audioFiles.length > 0) {
                console.log(`Found ${audioFiles.length} audio files`);
                
                const success = await audioEngine.init();
                console.log('AudioEngine init result:', success);

                if (success) {
                    try {
                        const audioLoadResult = await loadAudio(currentBarIndex);
                        console.log('Audio load result:', audioLoadResult);
                        
                        // Set states
                        setIsAudioLoaded(true);
                        console.log('isAudioLoaded set to true');
                        dispatch({ type: 'SET_GAME_PHASE', payload: 'ready' });
                        
                        // Platform-specific delay
                        if (isIOS) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }
                        
                        console.log('Final state check:', {
                            isAudioLoaded,
                            audioFiles: audioFiles.length,
                            currentBar: currentBarIndex
                        });
                    } catch (loadError) {
                        console.error('Error loading audio:', loadError);
                        setIsAudioLoaded(false);
                    }
                }
            } else {
                console.log('No audio files available yet');
            }
        } catch (error) {
            console.error('Audio initialization error:', error);
            setIsAudioLoaded(false);
        }
    };

    initAudio();

    return () => {
        console.log('Cleaning up audio initialization effect');
    };
}, [audioFiles, currentBarIndex, loadAudio, dispatch, isAudioLoaded]);
  // Fetch audio files effect
  useEffect(() => {
    const fetchAudioFiles = async () => {
        try {
            const jsonPath = `/assets/audio/testMelodies/game${currentGameNumber}/current.json`;
            console.log('Fetching JSON from:', jsonPath);
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Successfully loaded audio files:', data);
            setAudioFiles(data.melodyParts);
            setFullTunePath(data.fullTune);
            console.log('Audio files state updated');
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
 
  const handleListenPractice = useCallback(async () => {
    console.log('Listen & Practice button clicked');

    try {
        // Ensure audio context is running
        if (audioEngine?.audioContext?.state !== 'running') {
            await audioEngine.init();
        }

        // Try to play using AudioEngine first (preloaded audio)
        try {
            await audioEngine.playSound(`melody${currentBarIndex}`);
            dispatch({ type: 'SET_GAME_PHASE', payload: 'practice' });
            setGameMode('practice');
            setIsListenPracticeMode(true);
        } catch (error) {
            console.error('AudioEngine playback failed, falling back to Audio API:', error);
            
            // Fallback to Audio API if AudioEngine fails
            if (melodyAudio) {
                melodyAudio.currentTime = 0;
                await melodyAudio.play();
                dispatch({ type: 'SET_GAME_PHASE', payload: 'practice' });
                setGameMode('practice');
                setIsListenPracticeMode(true);
            }
        }
    } catch (error) {
        console.error("Error in handleListenPractice:", error);
    }
}, [melodyAudio, currentBarIndex, dispatch]);
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
const handlePerform = useCallback(async () => {
  if (gameState.gamePhase === 'perform') {
      if (melodyAudio) {
          // First ensure audio context is ready
          try {
              if (audioEngine?.audioContext?.state !== 'running') {
                  await audioEngine.init();
                  // Small delay for Android
                  await new Promise(resolve => setTimeout(resolve, 50));
              }

              // Reset audio state
              melodyAudio.currentTime = 0;
              
              // Try to play with retry mechanism
              try {
                  await melodyAudio.play();
              } catch (error) {
                  console.error("Initial melody playback failed:", error);
                  // Retry after reinitializing audio
                  try {
                      await audioEngine.init();
                      await melodyAudio.play();
                  } catch (retryError) {
                      console.error("Retry melody playback failed:", retryError);
                      // Try AudioEngine as last resort
                      try {
                          await audioEngine.loadSound(melodyAudio.src, `perform-melody-${currentBarIndex}`);
                          await audioEngine.playSound(`perform-melody-${currentBarIndex}`);
                      } catch (finalError) {
                          console.error("All playback attempts failed:", finalError);
                      }
                  }
              }
          } catch (error) {
              console.error("Error in perform mode playback:", error);
          }
      }
  } else {
      dispatch({ type: 'SET_GAME_PHASE', payload: 'perform' });
      setGameMode('play');
      setIsListenPracticeMode(false);
      dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
  }
}, [gameState.gamePhase, melodyAudio, dispatch, currentBarIndex]); // Removed audioEngine from dependencies

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

  // Try to recover audio context if needed
  if (audioEngine?.audioContext?.state !== 'running') {
    try {
      await audioEngine.init();
      // Add a small delay after resuming context (helps on Android)
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      return;
    }
  }

  // Play note with error handling
  try {
    console.log('Playing note:', noteNumber);
    const source = audioEngine.playSound(`n${noteNumber}`);
    if (!source) {
      throw new Error('No audio source created');
    }
  } catch (error) {
    console.error('Failed to play note:', error);
    // Try to recover
    try {
      await audioEngine.init();
      audioEngine.playSound(`n${noteNumber}`);
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }

  // Game logic for perform mode
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
        // Play wrong note sound with retry logic
        try {
          await audioEngine.playSound('wrong');
        } catch (error) {
          console.error('Failed to play wrong note sound:', error);
          try {
            await audioEngine.init();
            await audioEngine.playSound('wrong');
          } catch (retryError) {
            console.error('Retry to play wrong sound failed:', retryError);
          }
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
            await audioEngine.playSound('fail');
          } catch (error) {
            console.error('Failed to play fail sound:', error);
            try {
              await audioEngine.init();
              await audioEngine.playSound('fail');
            } catch (retryError) {
              console.error('Retry to play fail sound failed:', retryError);
            }
          }

          // Wait for animations to complete
          await new Promise(resolve => setTimeout(resolve, 1200));

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
            failedBars: gameState.failedBars
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
          ref={ref => console.log('Controls props:', {
            isListenPracticeMode,
            isPerformAvailable: isAudioLoaded,
            isAudioLoaded,
            gamePhase: gameState.gamePhase
          })}
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
            <div className="instructions-content">
              <h2>HOW TO PLAY</h2>
              <div className="instruction-flow">
                <p>
                  1. PRESS LISTEN & PRACTICE<br/>
                  2. FIND THE NOTES YOU HEAR<br/>
                  3. PRACTICE AS MUCH AS YOU NEED<br/>
                  4. PRESS PERFORM WHEN READY<br/>
                  5. CAREFUL - MISTAKES COST HEARTS!
                </p>
              </div>
              <p className="challenge">CAN YOU HIT THE RIGHT NOTES?</p>
              <button className="next-button instructions-next" onClick={() => setShowInstructions(false)}>
                <img src="/assets/images/ui/next.svg" alt="Next" />
              </button>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
}

export default App;
