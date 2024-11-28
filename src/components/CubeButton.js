import React, { useCallback, useRef } from 'react';
import './CubeButton.css';

const CubeButton = ({ 
  color, 
  frontImage, 
  bottomImage,
  noteNumber, 
  onNotePlay, 
  isGameEnded,
  isBarFailing 
}) => {
  const buttonRef = useRef({
    isPressed: false,
    hasPlayedNote: false
  });

  const playNote = useCallback(() => {
    console.log(`[CubeButton ${noteNumber}] Attempting to play note`);
    if (!isBarFailing && !buttonRef.current.hasPlayedNote) {
      console.log(`[CubeButton ${noteNumber}] Conditions met, playing note`);
      buttonRef.current.hasPlayedNote = true;
      onNotePlay(noteNumber);
    } else {
      console.log(`[CubeButton ${noteNumber}] Note blocked:`, {
        isBarFailing,
        hasPlayedNote: buttonRef.current.hasPlayedNote
      });
    }
  }, [isBarFailing, noteNumber, onNotePlay]);

  const handleTouchStart = useCallback((e) => {
    console.log(`[CubeButton ${noteNumber}] Touch Start Event:`, {
      type: e.type,
      touches: e.touches.length,
      timestamp: new Date().toISOString()
    });
    e.preventDefault();
    buttonRef.current.isPressed = true;
    buttonRef.current.hasPlayedNote = false;
    playNote();
  }, [playNote, noteNumber]);

  const handleTouchEnd = useCallback((e) => {
    console.log(`[CubeButton ${noteNumber}] Touch End Event:`, {
      type: e.type,
      timestamp: new Date().toISOString()
    });
    e.preventDefault();
    buttonRef.current.isPressed = false;
    buttonRef.current.hasPlayedNote = false;
  }, [noteNumber]);

  // Add touch move handler to prevent scrolling
  const handleTouchMove = useCallback((e) => {
    console.log(`[CubeButton ${noteNumber}] Touch Move Event`);
    e.preventDefault();
  }, [noteNumber]);

  const buttonClass = `cube-button ${color} ${isGameEnded ? 'game-ended' : ''} ${
    buttonRef.current.isPressed ? 'pressed' : ''
  }`;

  console.log(`[CubeButton ${noteNumber}] Rendering with class:`, buttonClass);

  return (
    <div 
      className={buttonClass}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      role="button"
      tabIndex={0}
    >
      <div className="cube-face front">
        <img 
          src={frontImage} 
          alt={`Note ${noteNumber} front`} 
          className="cube-image"
          draggable="false"
        />
      </div>
      <div className="cube-face bottom">
        <img 
          src={bottomImage} 
          alt={`Note ${noteNumber} bottom`} 
          className="cube-image"
          draggable="false"
        />
      </div>
    </div>
  );
};

export default React.memo(CubeButton);