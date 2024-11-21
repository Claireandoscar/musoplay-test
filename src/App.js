import React, { useState, useCallback, useEffect, useReducer } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import VirtualInstrument from './components/VirtualInstrument';
import ProgressBar from './components/ProgressBar';
import EndGameAnimation from './components/EndGameAnimation';
import StartScreen from './components/StartScreen';

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
  
  // Audio-related states
  const [audioFiles, setAudioFiles] = useState([]);
  const [fullTunePath, setFullTunePath] = useState('');
  const [fullTuneAudio, setFullTuneAudio] = useState(null);
  const [currentBarAudio, setCurrentBarAudio] = useState(null);
  const [wrongNoteAudio, setWrongNoteAudio] = useState(null);
  const [barCompleteAudio, setBarCompleteAudio] = useState(null);
  const [barFailedAudio, setBarFailedAudio] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [currentAudioSource, setCurrentAudioSource] = useState(null);

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
 
  const initializeAudioContext = useCallback(() => {
    if (!audioContext) {
      const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(newAudioContext);
      return newAudioContext;
    }
    return audioContext;
  }, [audioContext]);

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

  const handleListenPractice = useCallback(() => {
    // Always play the melody when clicked
    if (currentBarAudio && audioContext) {
        audioContext.resume().then(() => {
            const source = audioContext.createBufferSource();
            source.buffer = currentBarAudio;
            source.connect(audioContext.destination);
            source.start();
        });
    }

    // Always ensure we're in practice mode
    dispatch({ type: 'SET_GAME_PHASE', payload: 'practice' });
    setGameMode('practice');
    setIsListenPracticeMode(true);  // Always keep it true after first activation
}, [currentBarAudio, audioContext, dispatch]);


const handlePerform = useCallback(() => {
    // If we're already in perform mode, just play the melody
    if (gameState.gamePhase === 'perform') {
        if (currentBarAudio && audioContext) {
            audioContext.resume().then(() => {
                const source = audioContext.createBufferSource();
                source.buffer = currentBarAudio;
                source.connect(audioContext.destination);
                source.start();
            });
        }
    } else {
        // Initial transition to perform mode
        dispatch({ type: 'SET_GAME_PHASE', payload: 'perform' });
        setGameMode('play');
        setIsListenPracticeMode(false);
        dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
    }
}, [gameState.gamePhase, currentBarAudio, audioContext, dispatch]);


useEffect(() => {
  async function loadFullTune() {
      if (!fullTunePath) return;
      try {
          console.log('Loading full tune from:', fullTunePath);  // Debug log
          const response = await fetch(fullTunePath);
          const arrayBuffer = await response.arrayBuffer();
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          setFullTuneAudio(audioBuffer);
          console.log('Full tune loaded successfully');  // Debug log
      } catch (error) {
          console.error('Failed to load full tune:', error, fullTunePath);
      }
  }

  loadFullTune();
}, [fullTunePath]);

  useEffect(() => {
    function setVH() {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setVH();
    window.addEventListener('resize', setVH);

    return () => window.removeEventListener('resize', setVH);
  }, []);

  useEffect(() => {
    document.body.className = gameMode;
  }, [gameMode]);

  useEffect(() => {
    if (audioFiles.length > 0) {
        console.log('Processing audio files:', audioFiles);
        
        const sequences = audioFiles.map(filepath => {
            const filename = filepath.split('/').pop();
            console.log('Processing filename:', filename);
            
            // Extract everything after the 'bar' prefix
            const noteSection = filename.split('bar')[1];
            console.log('Note section:', noteSection);
            
            // Split by 'n' and remove the first element (bar number) and .mp3
            const noteSequence = noteSection
                .split('n')
                .slice(1)  // Remove bar number
                .map(note => note.replace('.mp3', ''));
            
            console.log('Extracted note sequence:', noteSequence);
            
            // Fixed processing of notes into objects
            const processedSequence = noteSequence.map(note => {
                const cleanNote = note.replace('.mp3', '');
                return {
                    number: parseInt(cleanNote.replace('QL', '').replace('QR', ''), 10),
                    isQuaverLeft: cleanNote.includes('QL'),
                    isQuaverRight: cleanNote.includes('QR'),
                    fullNote: cleanNote
                };
            });
            
            console.log('Processed sequence with note objects:', processedSequence);
            return processedSequence;
        });
        
        console.log('Final sequences array with full note objects:', sequences);
        setCorrectSequence(sequences);
        dispatch({ type: 'RESET_COMPLETED_BARS' });
    }
}, [audioFiles, dispatch]);

useEffect(() => {
    const cleanupAudio = () => {
      if (currentAudioSource) {
        try {
          currentAudioSource.stop();
          currentAudioSource.disconnect();
        } catch (error) {
          console.log('Error cleaning up audio source:', error);
        }
      }
      setWrongNoteAudio(null);
      setBarCompleteAudio(null);
      setBarFailedAudio(null);
    };
    return cleanupAudio;
  }, [currentAudioSource]); 

  useEffect(() => {
    const cleanup = () => {
      if (window.gc) {
        window.gc();
      }
    };
    document.addEventListener('visibilitychange', cleanup);
    return () => {
      document.removeEventListener('visibilitychange', cleanup);
      cleanup();
    };
  }, []);

  useEffect(() => {
    const loadAudio = async (audioPath, setAudioState) => {
      try {
        const response = await fetch(audioPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioState(audioBuffer);
      } catch (error) {
        console.error(`Failed to load audio: ${audioPath}`, error);
      }
    };

    loadAudio('/assets/audio/ui-sounds/wrong-note.mp3', setWrongNoteAudio);
    loadAudio('/assets/audio/ui-sounds/bar-complete.mp3', setBarCompleteAudio);
    loadAudio('/assets/audio/ui-sounds/bar-failed.mp3', setBarFailedAudio);
  }, []);

  const loadAudio = useCallback(async (barIndex) => {
    if (audioFiles.length === 0) return;
    const audioPath = audioFiles[barIndex];
    try {
      const response = await fetch(audioPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const ctx = initializeAudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      setCurrentBarAudio(audioBuffer);
    } catch (error) {
      console.error(`Failed to load audio for Bar ${barIndex + 1}:`, error);
      setCurrentBarAudio(null);
    }
  }, [audioFiles, initializeAudioContext]);

  useEffect(() => {
    if (correctSequence.length > 0) {
      loadAudio(currentBarIndex);
    }
  }, [currentBarIndex, correctSequence, loadAudio]);

  const handleStartGame = () => {
    const ctx = initializeAudioContext();
    ctx.resume().then(() => {
        // Reset screen and game mode states
        setShowStartScreen(false);
        setGameMode('initial');
        
        // Use dispatch for game state resets
        dispatch({ type: 'SET_GAME_PHASE', payload: 'initial' });
        dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
        dispatch({ type: 'RESET_BAR_HEARTS' });
        dispatch({ type: 'RESET_COMPLETED_BARS' });
        dispatch({ type: 'SET_BAR_FAILING', failing: false });
        
        // Reset other states
        setScore(0);
        setCurrentBarIndex(0);
        setIsGameComplete(false);
        setIsGameEnded(false);
        setShowEndAnimation(false);
        setIsListenPracticeMode(false);
        setFailedBars([false, false, false, false]);
    });
};


const moveToNextBar = useCallback((isSuccess = true) => {
  // Clear previous bar data
  setCurrentBarAudio(null);
  
  // Function to handle end of game
  const handleGameEnd = async () => {
      setIsGameComplete(true);
      setIsGameEnded(true);
      setGameMode('ended');
      setIsListenPracticeMode(false);
      dispatch({ type: 'SET_GAME_PHASE', payload: 'ended' });

      // Wait for state updates before showing animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowEndAnimation(true);
      if (fullTuneAudio) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createBufferSource();
          const gainNode = audioContext.createGain();
          
          source.buffer = fullTuneAudio;
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          source.start();
          
          source.gainNode = gainNode;
          setCurrentAudioSource(source);
      }
  };

  // Function to handle moving to next bar
  const handleNextBar = async () => {
      // Update completed bars
      dispatch({ 
          type: 'UPDATE_COMPLETED_BARS', 
          barIndex: currentBarIndex,
          completed: true
      });

      // Play completion sound if successful
      if (barCompleteAudio && isSuccess) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createBufferSource();
          source.buffer = barCompleteAudio;
          source.connect(audioContext.destination);
          source.start();
      }

      // Reset states for next bar
      dispatch({ type: 'UPDATE_NOTE_INDEX', payload: 0 });
      dispatch({ type: 'SET_GAME_PHASE', payload: 'initial' });
      setGameMode('initial');
      setIsListenPracticeMode(false);
      
      // Load audio for next bar
      await loadAudio(currentBarIndex + 1);

      // Finally update the bar index
      setCurrentBarIndex(prev => prev + 1);
  };

  // Main logic
  const nextBarIndex = currentBarIndex + 1;
  if (nextBarIndex < correctSequence.length) {
      handleNextBar();
  } else {
      handleGameEnd();
  }
}, [
  currentBarIndex, 
  correctSequence.length, 
  loadAudio, 
  barCompleteAudio, 
  fullTuneAudio,
  setCurrentAudioSource,
  dispatch
]);
  // Function to handle audio fade out
  const handleNextGame = () => {
    if (currentGameNumber >= 3) {
        console.log('All games completed - should redirect to survey');
        return;
    }

    // Clear existing audio
    if (currentAudioSource) {
        try {
            currentAudioSource.stop();
            currentAudioSource.disconnect();
            setCurrentAudioSource(null);
        } catch (error) {
            console.log('Error cleaning up audio source:', error);
        }
    }

    // Reset all state
    setAudioFiles([]);
    setFullTuneAudio(null);
    setCurrentBarAudio(null);
    setScore(0);
    setCurrentBarIndex(0);
    setFailedBars([false, false, false, false]);
    
    // Reset reducer state
    dispatch({ type: 'RESET_GAME_STATE' });
    
    // Function to handle audio fade out
    const fadeOutAudio = async () => {
        if (currentAudioSource) {
            try {
                const gainNode = currentAudioSource.gainNode;
                gainNode.gain.linearRampToValueAtTime(0, currentAudioSource.context.currentTime + 0.5);
                
                await new Promise(resolve => setTimeout(resolve, 500));
                currentAudioSource.stop();
                setCurrentAudioSource(null);
            } catch (error) {
                console.log('Error with audio fade:', error);
                // Cleanup even if fade fails
                setCurrentAudioSource(null);
            }
        }
    };

    // Function to reset game states
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

    // Main execution
    const startNextGame = async () => {
        await fadeOutAudio();
        resetGameStates();
        const ctx = initializeAudioContext();
        await ctx.resume();
    };

    startNextGame();
};

const handleNotePlay = useCallback((noteNumber) => {
    console.log('Note play start state:', {
      noteNumber,
      gamePhase: gameState.gamePhase,
      currentBarIndex,
      currentNoteIndex: gameState.currentNoteIndex,
      currentSequence: correctSequence[currentBarIndex],
    });
  
    if (gameState.gamePhase !== 'practice' && gameState.gamePhase !== 'perform') {
      return;
    }
  
    // Play note sound
    const audio = new Audio(`/assets/audio/n${noteNumber}.mp3`);
    audio.play().catch(error => console.error("Audio playback failed:", error));
  
    if (gameState.gamePhase === 'perform' && !gameState.isBarFailing) {
      const currentSequence = correctSequence[currentBarIndex];
      const currentNote = currentSequence[gameState.currentNoteIndex];
      
      console.log('Checking note:', {
        played: noteNumber,
        expected: currentNote?.number,
        noteIndex: gameState.currentNoteIndex,
        sequence: currentSequence
      });
  
      const isCorrectNote = noteNumber === currentNote.number;
  
      if (isCorrectNote) {
        const newNoteIndex = gameState.currentNoteIndex + 1;
        console.log('Correct note, updating index:', newNoteIndex);
        
        dispatch({ type: 'UPDATE_NOTE_INDEX', payload: newNoteIndex });
  
        if (newNoteIndex === currentSequence.length) {
          const updatedScore = gameState.barHearts[currentBarIndex];
          setScore(prevScore => prevScore + updatedScore);
          moveToNextBar(true);
        }
      } else {
        // Handle wrong note with audio feedback
        const handleWrongNote = async () => {
          dispatch({ 
            type: 'WRONG_NOTE',
            barIndex: currentBarIndex
          });
  
          // Play wrong note sound
          if (wrongNoteAudio) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createBufferSource();
            source.buffer = wrongNoteAudio;
            source.connect(audioContext.destination);
            source.start();
          }
  
          // Check if bar failed
          if (gameState.barHearts[currentBarIndex] <= 1) { // Check if this will be the last heart
            dispatch({ 
              type: 'SET_BAR_FAILING',
              failing: true
            });
  
            // Play bar failed sound after a short delay
            setTimeout(() => {
              if (barFailedAudio) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createBufferSource();
                source.buffer = barFailedAudio;
                source.connect(audioContext.destination);
                source.start();
              }
            }, 300);
  
            // Move to next bar after failure animation
            setTimeout(() => {
              dispatch({ 
                type: 'SET_BAR_FAILING',
                failing: false
              });
              moveToNextBar(false);
            }, 1500);
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
    moveToNextBar,
    wrongNoteAudio,
    barFailedAudio
  ]);

if (showStartScreen) {
  return (
      <div className="game-wrapper">
          <div className="game-container">
              <StartScreen onStartGame={handleStartGame} />
          </div>
      </div>
  );
}

return (
  <div className="game-wrapper">
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
              isAudioLoaded={!!currentBarAudio}
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
  </div>
);
}

export default App;