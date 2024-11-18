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
    if (!isListenPracticeMode) {
        // First click - play melody and enter practice mode
        if (currentBarAudio && audioContext) {
            audioContext.resume().then(() => {
                const source = audioContext.createBufferSource();
                source.buffer = currentBarAudio;
                source.connect(audioContext.destination);
                source.start();
            });
        }
    }
    
    setIsListenPracticeMode(prev => !prev);
    setGamePhase('practice');
    setGameMode('practice');
}, [currentBarAudio, audioContext, isListenPracticeMode]);

const handlePerform = useCallback(() => {
    setGamePhase('perform');
    setGameMode('play');
    setIsListenPracticeMode(false);  // This will disable Listen & Practice
    setCurrentNoteIndex(0);
}, []);

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
    setCompletedBars(prevCompletedBars => {
        const newCompletedBars = [...prevCompletedBars];
        newCompletedBars[currentBarIndex] = true;
        return newCompletedBars;
    });

    if (barCompleteAudio && isSuccess) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = barCompleteAudio;
        source.connect(audioContext.destination);
        source.start();
    }

    const nextBarIndex = currentBarIndex + 1;
    if (nextBarIndex < correctSequence.length) {
        setCurrentBarIndex(nextBarIndex);
        setCurrentNoteIndex(0);
        setBarHearts(prevBarHearts => {
            const newBarHearts = [...prevBarHearts];
            newBarHearts[nextBarIndex] = 4;
            return newBarHearts;
        });
        loadAudio(nextBarIndex);
        
        // Updated reset states for new bar
        setGamePhase('initial');
        setGameMode('initial');
        setIsListenPracticeMode(false);  // Reset listen/practice mode
    } else {
        setIsGameComplete(true);
        setIsGameEnded(true);
        setGameMode('ended');
        setIsListenPracticeMode(false);  // Reset listen/practice mode
        
        setTimeout(() => {
            setShowEndAnimation(true);
            if (fullTuneAudio) {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const source = audioContext.createBufferSource();
              const gainNode = audioContext.createGain();
              
              source.buffer = fullTuneAudio;
              source.connect(gainNode);
              gainNode.connect(audioContext.destination);
              source.start();
              
              // Store both source and gain node for later access
              source.gainNode = gainNode;
              setCurrentAudioSource(source);
          }
        }, 2000);
    }
}, [currentBarIndex, correctSequence.length, loadAudio, barCompleteAudio, fullTuneAudio]);

const handleNextGame = () => {
  if (currentGameNumber < 3) {
    // Fade out and stop any playing audio
    if (currentAudioSource) {
      try {
        const gainNode = currentAudioSource.gainNode;
        gainNode.gain.linearRampToValueAtTime(0, currentAudioSource.context.currentTime + 0.5);
        
        // Stop after fade
        setTimeout(() => {
          currentAudioSource.stop();
          setCurrentAudioSource(null);
        }, 500);
      } catch (error) {
        console.log('Error with audio fade:', error);
      }
    }

    // Immediate state updates
    setCurrentGameNumber(prev => prev + 1);
    setIsGameComplete(false);
    setShowEndAnimation(false);
    setIsGameEnded(false);
    
    // Reset game states
    setScore(0);
    setBarHearts([4, 4, 4, 4]);
    setCurrentBarIndex(0);
    setCurrentNoteIndex(0);
    setCompletedBars([false, false, false, false]);
    
    // Reset game phases and mode
    setGameMode('initial');
    setGamePhase('initial');
    setFailedBars([false, false, false, false]);
    
    // Reset UI states
    setIsListenPracticeMode(false);

    // Initialize audio
    const ctx = initializeAudioContext();
    ctx.resume();
  } else {
    console.log('All games completed - should redirect to survey');
  }
};

const handleNotePlay = useCallback((noteNumber) => {
  // Only allow note playing in practice or perform modes
  if (gamePhase === 'practice' || gamePhase === 'perform') {
      // Play the note sound
      const audio = new Audio(`/assets/audio/n${noteNumber}.mp3`);
      audio.play().catch(error => console.error("Audio playback failed:", error));

      // Handle game logic only in perform phase
      if (gamePhase === 'perform' && !isBarFailing) {
          const currentSequence = correctSequence[currentBarIndex];
          const currentNote = currentSequence[currentNoteIndex];
          const isCorrectNote = noteNumber === currentNote.number;

          if (isCorrectNote) {
              const newNoteIndex = currentNoteIndex + 1;
              setCurrentNoteIndex(newNoteIndex);

              if (newNoteIndex === currentSequence.length) {
                  setScore(prevScore => prevScore + barHearts[currentBarIndex]);
                  moveToNextBar(true);
              }
          } else {
              if (wrongNoteAudio) {
                  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  const source = audioContext.createBufferSource();
                  source.buffer = wrongNoteAudio;
                  source.connect(audioContext.destination);
                  source.start();
              }

              setCurrentNoteIndex(0);

              setBarHearts(prevBarHearts => {
                  const newBarHearts = [...prevBarHearts];
                  newBarHearts[currentBarIndex] = Math.max(0, newBarHearts[currentBarIndex] - 1);
                  
                  if (newBarHearts[currentBarIndex] === 0) {
                      setIsBarFailing(true);
                      setFailedBars(prev => {
                          const newFailedBars = [...prev];
                          newFailedBars[currentBarIndex] = true;
                          return newFailedBars;
                      });
                      
                      setTimeout(() => {
                          if (barFailedAudio) {
                              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                              const source = audioContext.createBufferSource();
                              source.buffer = barFailedAudio;
                              source.connect(audioContext.destination);
                              source.start();
                          }
                      }, 300);
              
                      setTimeout(() => {
                          setIsBarFailing(false);
                          moveToNextBar(false);
                      }, 1500);
                  }
                  
                  return newBarHearts;
              });
          }
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