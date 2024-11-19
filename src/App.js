import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import VirtualInstrument from './components/VirtualInstrument';
import ProgressBar from './components/ProgressBar';
import EndGameAnimation from './components/EndGameAnimation';
import StartScreen from './components/StartScreen';


function App() {
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
  const [gamePhase, setGamePhase] = useState('initial'); // 'initial', 'practice', 'perform'
  const [barHearts, setBarHearts] = useState([4, 4, 4, 4]);
  const [score, setScore] = useState(0);
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isBarFailing, setIsBarFailing] = useState(false);
  const [failedBars, setFailedBars] = useState([false, false, false, false]);
  const [currentGameNumber, setCurrentGameNumber] = useState(1);
  // In App.js, near your other useState declarations
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Sequence and completion tracking
  const [correctSequence, setCorrectSequence] = useState([]);
  const [completedBars, setCompletedBars] = useState([]);
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
    setGamePhase('practice');
    setGameMode('practice');
    setIsListenPracticeMode(true);  // Always keep it true after first activation
}, [currentBarAudio, audioContext]);

const handlePerform = useCallback(() => {
    // If we're already in perform mode, just play the melody
    if (gamePhase === 'perform') {
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
        setGamePhase('perform');
        setGameMode('play');
        setIsListenPracticeMode(false);  // Disable Listen & Practice
        setCurrentNoteIndex(0);
    }
}, [gamePhase, currentBarAudio, audioContext]);


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
      const sequences = audioFiles.map(filepath => {
        const filename = filepath.split('/').pop();
        const noteSequence = filename
          .split('n')
          .slice(1)
          .map(note => note.replace('.mp3', ''));
        
        return noteSequence.map(note => ({
          number: parseInt(note.replace('QL', '').replace('QR', ''), 10),
          isQuaverLeft: note.includes('QL'),
          isQuaverRight: note.includes('QR'),
          fullNote: note
        }));
      });
      setCorrectSequence(sequences);
      setCompletedBars(new Array(sequences.length).fill(false));
    }
  }, [audioFiles]);

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
        setGamePhase('initial');
        
        // Reset game progress states
        setCurrentBarIndex(0);
        setCurrentNoteIndex(0);
        setScore(0);
        setBarHearts([4, 4, 4, 4]);
        
        // Reset game completion states
        setIsGameComplete(false);
        setIsGameEnded(false);
        setShowEndAnimation(false);
        
        // Reset UI state for new combined button
        setIsListenPracticeMode(false);
        
        // Reset any failed states if they exist
        setFailedBars([false, false, false, false]);
        setIsBarFailing(false);
        
        // Reset completion tracking
        setCompletedBars(new Array(4).fill(false));
    });
};
  
const moveToNextBar = useCallback((isSuccess = true) => {
  // Function to handle end of game
  const handleGameEnd = async () => {
      setIsGameComplete(true);
      setIsGameEnded(true);
      setGameMode('ended');
      setIsListenPracticeMode(false);

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
          
          // Store source and gain node for later control
          source.gainNode = gainNode;
          setCurrentAudioSource(source);
      }
  };

  // Function to handle moving to next bar
  const handleNextBar = async () => {
      // Update completed bars
      setCompletedBars(prevCompletedBars => {
          const newCompletedBars = [...prevCompletedBars];
          newCompletedBars[currentBarIndex] = true;
          return newCompletedBars;
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
      setCurrentNoteIndex(0);
      setGamePhase('initial');
      setGameMode('initial');
      setIsListenPracticeMode(false);
      
      // Prepare hearts for next bar
      setBarHearts(prevBarHearts => {
          const newBarHearts = [...prevBarHearts];
          newBarHearts[currentBarIndex + 1] = 4;
          return newBarHearts;
      });

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
  setCurrentAudioSource
]);
const handleNextGame = () => {
  if (currentGameNumber >= 3) {
      console.log('All games completed - should redirect to survey');
      return;
  }

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
      setBarHearts([4, 4, 4, 4]);
      setCurrentBarIndex(0);
      setCurrentNoteIndex(0);
      setCompletedBars([false, false, false, false]);
      
      // Reset game modes
      setGameMode('initial');
      setGamePhase('initial');
      setFailedBars([false, false, false, false]);
      
      // Reset UI states
      setIsListenPracticeMode(false);
  };

  // Main execution
  const startNextGame = async () => {
      // First handle audio
      await fadeOutAudio();
      
      // Then reset all states
      resetGameStates();
      
      // Finally initialize audio for new game
      const ctx = initializeAudioContext();
      await ctx.resume();
  };

  startNextGame();
};
const handleNotePlay = useCallback((noteNumber) => {
  // Early return if not in valid game phase
  if (gamePhase !== 'practice' && gamePhase !== 'perform') {
      return;
  }

  // Play note sound
  const audio = new Audio(`/assets/audio/n${noteNumber}.mp3`);
  audio.play().catch(error => console.error("Audio playback failed:", error));

  // Only handle game logic in perform mode and when not already failing
  if (gamePhase === 'perform' && !isBarFailing) {
      const currentSequence = correctSequence[currentBarIndex];
      const currentNote = currentSequence[currentNoteIndex];
      const isCorrectNote = noteNumber === currentNote.number;

      if (isCorrectNote) {
          // Handle correct note
          const newNoteIndex = currentNoteIndex + 1;
          
          if (newNoteIndex === currentSequence.length) {
              // Bar complete
              const updatedScore = barHearts[currentBarIndex];
              setScore(prevScore => prevScore + updatedScore);
              moveToNextBar(true);
          } else {
              // Continue in current bar
              setCurrentNoteIndex(newNoteIndex);
          }
      } else {
          // Handle wrong note with immediate state cleanup
          const handleWrongNote = async () => {
              // Immediate state cleanup
              setCurrentNoteIndex(0);
              setGamePhase('perform');
              
              // Force cleanup of any lingering states
              setCompletedBars(prev => {
                  const newBars = [...prev];
                  newBars[currentBarIndex] = false;
                  return newBars;
              });

              // Play wrong note sound
              if (wrongNoteAudio) {
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  const source = audioContext.createBufferSource();
                  source.buffer = wrongNoteAudio;
                  source.connect(audioContext.destination);
                  source.start();
              }

              // Update hearts
              const updatedHearts = await new Promise(resolve => {
                  setBarHearts(prevBarHearts => {
                      const newBarHearts = [...prevBarHearts];
                      newBarHearts[currentBarIndex] = Math.max(0, newBarHearts[currentBarIndex] - 1);
                      resolve(newBarHearts[currentBarIndex]);
                      return newBarHearts;
                  });
              });

              // Check if bar failed
              if (updatedHearts === 0) {
                  setIsBarFailing(true);
                  setFailedBars(prev => {
                      const newFailedBars = [...prev];
                      newFailedBars[currentBarIndex] = true;
                      return newFailedBars;
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
                      setIsBarFailing(false);
                      moveToNextBar(false);
                  }, 1500);
              }
          };

          handleWrongNote();
      }
  }
}, [
  gamePhase,
  isBarFailing,
  correctSequence,
  currentBarIndex,
  currentNoteIndex,
  wrongNoteAudio,
  barFailedAudio,
  moveToNextBar,
  barHearts
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
  console.log('Setting showInstructions to true');  // Debug log
  setShowInstructions(true);
}} />
        <GameBoard 
  barHearts={barHearts} 
  currentBarIndex={currentBarIndex}
  renderBar={{
    correctSequence,
    currentNoteIndex,
    completedBars,
    isGameComplete,
    failedBars
  }}
  isBarFailed={isBarFailing}
  gamePhase={gamePhase}
/>
        <Controls 
          onListenPractice={handleListenPractice}
          onPerform={handlePerform}
          isListenPracticeMode={isListenPracticeMode}
          isPerformAvailable={true}
          isAudioLoaded={!!currentBarAudio}
          gamePhase={gamePhase}
        />
        <VirtualInstrument 
          notes={notes}
          onNotePlay={handleNotePlay}
          isGameEnded={isGameEnded}
          isBarFailing={isBarFailing}
        />
        <ProgressBar completedBars={completedBars.filter(Boolean).length} />
        {showEndAnimation && (
          <EndGameAnimation 
            score={score} 
            barHearts={barHearts} 
            onNext={handleNextGame}
            currentGameNumber={currentGameNumber}
          />
        )}
        {/* Add instructions popup */}
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