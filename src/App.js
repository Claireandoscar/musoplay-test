import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Controls from './components/Controls';
import VirtualInstrument from './components/VirtualInstrument';
import ProgressBar from './components/ProgressBar';
import EndGameAnimation from './components/EndGameAnimation';
import StartScreen from './components/StartScreen';


function App() {
  const [testGameNumber, setTestGameNumber] = useState(() => {
    return parseInt(localStorage.getItem('currentGame')) || 1;
  });
  const [audioFiles, setAudioFiles] = useState([]);
  const [fullTunePath, setFullTunePath] = useState('');
  const [fullTuneAudio, setFullTuneAudio] = useState(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [gameMode, setGameMode] = useState('initial');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [barHearts, setBarHearts] = useState([4, 4, 4, 4]);
  const [score, setScore] = useState(0);
  const [correctSequence, setCorrectSequence] = useState([]);
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [currentBarAudio, setCurrentBarAudio] = useState(null);
  const [wrongNoteAudio, setWrongNoteAudio] = useState(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [completedBars, setCompletedBars] = useState([]);
  const [isPlayButtonAnimated, setIsPlayButtonAnimated] = useState(true);
  const [isTestButtonAvailable, setIsTestButtonAvailable] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [barCompleteAudio, setBarCompleteAudio] = useState(null);
  const [barFailedAudio, setBarFailedAudio] = useState(null);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [isBarFailing, setIsBarFailing] = useState(false);
  const [failedBars, setFailedBars] = useState([false, false, false, false]);
 
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

  useEffect(() => {
    const fetchAudioFiles = async () => {
      try {
        const jsonPath = '/data/dailyMelodies/current.json';
        const response = await fetch(jsonPath);
        const data = await response.json();
        setAudioFiles(data.melodyParts);
        setFullTunePath(data.fullTune);
      } catch (error) {
        console.error('Failed to load current.json:', error);
      }
    };
  
    fetchAudioFiles();
  }, [testGameNumber]); // Add testGameNumber as dependency

  useEffect(() => {
    async function loadFullTune() {
      if (!fullTunePath) return;
      try {
        const response = await fetch(fullTunePath);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setFullTuneAudio(audioBuffer);
      } catch (error) {
        console.error('Failed to load full tune:', error);
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

  const playCurrentBarAudio = useCallback(() => {
    if (currentBarAudio && audioContext) {
      audioContext.resume().then(() => {
        const source = audioContext.createBufferSource();
        source.buffer = currentBarAudio;
        source.connect(audioContext.destination);
        source.start();
      });
    }
  }, [currentBarAudio, audioContext]);

  const handleTest = useCallback(() => {
    if (isTestButtonAvailable) {
      setIsTestMode(prev => !prev);
      if (isTestMode) {
        setGameMode('initial');
        setCurrentNoteIndex(0);
      } else {
        setGameMode('practice');
      }
    }
  }, [isTestButtonAvailable, isTestMode]);

  const handlePlay = useCallback(() => {
    if (isTestMode) {
      playCurrentBarAudio();
      return;
    }

    setGameMode('play');
    setIsGameStarted(true);
    setCurrentNoteIndex(0);
    setIsTestButtonAvailable(true);
    setIsFlipped(true);
    playCurrentBarAudio();
    setIsPlayButtonAnimated(false);
    if (!isGameStarted) {
      setCurrentBarIndex(0);
    }
  }, [isTestMode, isGameStarted, playCurrentBarAudio]);

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
      setIsPlayButtonAnimated(true);
      setIsTestMode(false);
      setIsTestButtonAvailable(false);
      setGameMode('initial');
    } else {
      setIsGameComplete(true);
      setIsGameEnded(true);
      setIsFlipped(true);
      setGameMode('ended');
      
      setTimeout(() => {
        setShowEndAnimation(true);
        if (fullTuneAudio) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createBufferSource();
          source.buffer = fullTuneAudio;
          source.connect(audioContext.destination);
          source.start();
        }
      }, 2000);
    }
  }, [currentBarIndex, correctSequence.length, loadAudio, barCompleteAudio, fullTuneAudio]);

  const handleNotePlay = useCallback((noteNumber) => {
    // If bar is failing, don't do anything
    if (isBarFailing) return;

    // Play the note sound
    const audio = new Audio(`/assets/audio/n${noteNumber}.mp3`);
    audio.play().catch(error => console.error("Audio playback failed:", error));

    // If in test mode, only play the sound
    if (isTestMode) {
      console.log(`Test mode: Note ${noteNumber} played`);
      return;
    }

    if (!isGameStarted || isGameComplete || correctSequence.length === 0) return;

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
        setIsPlayButtonAnimated(true);

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
  }, [currentBarIndex, currentNoteIndex, correctSequence, wrongNoteAudio, barHearts, 
    moveToNextBar, barFailedAudio, isBarFailing, isTestMode, isGameComplete, isGameStarted]);
const renderBar = useCallback((BarComponent, index) => {
  return (
    <BarComponent 
      key={index}
      isActive={currentBarIndex === index}
      sequence={correctSequence[index] || []}
      currentNoteIndex={currentBarIndex === index ? currentNoteIndex : 0}
      isBarComplete={completedBars[index]}
      isGameComplete={isGameComplete}
      isBarFailing={isBarFailing}
      hasFailed={failedBars[index]}  // Add this line
    />
  );
}, [currentBarIndex, currentNoteIndex, completedBars, correctSequence, isGameComplete, isBarFailing, failedBars]);
  const handleStartGame = () => {
    const ctx = initializeAudioContext();
    ctx.resume().then(() => {
      setShowStartScreen(false);
      setGameMode('initial');
      setIsGameStarted(false);
      setCurrentBarIndex(0);
      setCurrentNoteIndex(0);
      setScore(0);
      setBarHearts([4, 4, 4, 4]);
      setIsGameComplete(false);
      setIsGameEnded(false);
      setShowEndAnimation(false);
    });
  };
  
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
        <GameBoard 
          barHearts={barHearts} 
          currentBarIndex={currentBarIndex} 
          renderBar={renderBar}
          isBarFailed={isBarFailing}
        />
        <Controls 
          onTest={handleTest}
          onPlay={handlePlay}
          isTestMode={isTestMode}
          isTestButtonAvailable={isTestButtonAvailable}
          currentBarIndex={currentBarIndex}
          isAudioLoaded={!!currentBarAudio}
          isPlayButtonAnimated={isPlayButtonAnimated}
        />
        <VirtualInstrument 
          notes={notes}
          isFlipped={isFlipped}
          onNotePlay={handleNotePlay}
          isGameEnded={isGameEnded}
          isBarFailing={isBarFailing}
        />
        <ProgressBar completedBars={completedBars.filter(Boolean).length} />
        {showEndAnimation && (
          <EndGameAnimation 
            score={score} 
            barHearts={barHearts} 
          />
        )}
      </div>
    </div>
  );
}
export default App;