import React, { useState, useEffect } from 'react';
import './Bar.css';

const Bar = ({ 
  barNumber,
  isActive, 
  sequence, 
  currentNoteIndex, 
  isBarComplete, 
  isGameComplete, 
  hasFailed,
  gamePhase,
  isBarFailing
}) => {
  const [flippedNotes, setFlippedNotes] = useState({});
  const [flipSound] = useState(new Audio('/assets/audio/ui-sounds/note-flip.mp3'));
  const [visibleNotes, setVisibleNotes] = useState([]);

  // Constants remain the same
  const crotchetPositions = [0, 70, 140, 210];
  const quaverOffsets = {
    left: 5,
    right: 32.6
  };

  const noteNameMap = {
    1: 'c',
    2: 'd',
    3: 'e',
    4: 'f',
    5: 'g',
    6: 'a',
    7: 'b',
    8: 'c8'
  };

  // Separate effect to handle note visibility
  useEffect(() => {
    if (!sequence) return;
    
    const newVisibleNotes = sequence.map((_, index) => {
      // Cases for note visibility
      const isVisibleDuringPlay = (
        gamePhase === 'perform' &&
        index < currentNoteIndex &&
        !isBarComplete &&
        !isBarFailing &&
        currentNoteIndex !== 0
      );

      const isVisibleWhenComplete = (
        (isBarComplete && !isBarFailing) ||
        isGameComplete
      );

      return isVisibleDuringPlay || isVisibleWhenComplete;
    });

    setVisibleNotes(newVisibleNotes);
  }, [sequence, currentNoteIndex, isBarComplete, isGameComplete, gamePhase, isBarFailing]);

  // Original helper functions remain the same
  const getNotePosition = (note, index, sequence) => {
    let beatIndex = 0;
    for (let i = 0; i < index; i++) {
      if (sequence[i].isQuaverLeft || sequence[i].isQuaverRight) {
        if (sequence[i].isQuaverRight) beatIndex++;
      } else {
        beatIndex++;
      }
    }

    if (note.isQuaverLeft) {
      return crotchetPositions[beatIndex] + quaverOffsets.left;
    }
    if (note.isQuaverRight) {
      return crotchetPositions[beatIndex] + quaverOffsets.right;
    }
    return crotchetPositions[beatIndex];
  };

  const getNoteImagePath = (note, isFlipped) => {
    const path = isFlipped ? 
      (note.isQuaverLeft || note.isQuaverRight) ?
        `/assets/images/bar-notes/note-namesQ/${noteNameMap[note.number]}Q.svg` :
        `/assets/images/bar-notes/note-namesC/${noteNameMap[note.number]}.svg`
      : 
      (note.isQuaverLeft || note.isQuaverRight) ?
        `/assets/images/bar-notes/quavers/n${note.fullNote}.svg` :
        `/assets/images/bar-notes/crochets/n${note.number}.svg`;
    
    return path;
  };

  const handleNoteClick = (index) => {
    if (isBarComplete || isGameComplete) {
      flipSound.currentTime = 0;
      flipSound.play().catch(error => console.log('Audio play failed:', error));
      
      setFlippedNotes(prev => ({
        ...prev,
        [index]: !prev[index]
      }));
    }
  };

  // Debug log
  useEffect(() => {
    console.log('Bar rendering:', {
      barNumber,
      sequence: sequence?.length,
      currentNoteIndex,
      gamePhase,
      isBarComplete,
      isGameComplete,
      isBarFailing
    });
  }, [barNumber, sequence, currentNoteIndex, gamePhase, isBarComplete, isGameComplete, isBarFailing]);

  return (
    <div className={`bar bar${barNumber} ${isActive ? 'active' : ''}`}>
      <div className="line"></div>
      {hasFailed ? (
        [...Array(4)].map((_, index) => (
          <div
            key={index}
            className="note visible"
            style={{ 
              left: `${crotchetPositions[index]}px`,
              width: '60px'
            }}
          >
            <img 
              src="/assets/images/ui/heart-empty.svg"
              alt="Empty Heart"
              className="note-image"
            />
          </div>
        ))
      ) : (
        sequence?.map((note, index) => (
          <div
            key={index}
            onClick={() => handleNoteClick(index)}
            className={`note 
              ${visibleNotes[index] ? 'visible' : ''} 
              ${note.isQuaverLeft || note.isQuaverRight ? 'quaver' : 'crotchet'}
              ${flippedNotes[index] ? 'flipped' : ''}
              ${(isBarComplete || isGameComplete) ? 'clickable' : ''}`
            }
            style={{ 
              left: `${getNotePosition(note, index, sequence)}px`,
              width: note.isQuaverLeft || note.isQuaverRight ? '27.6px' : '60px'
            }}
          >
            <div className="note-front">
              <img 
                src={getNoteImagePath(note, false)}
                alt={`Note ${note.fullNote || note.number}`}
                className="note-image"
              />
            </div>
            <div className="note-back">
              <img 
                src={getNoteImagePath(note, true)}
                alt={`Note name ${noteNameMap[note.number]}`}
                className="note-image"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Bar;