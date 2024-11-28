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
  // Use ref to track touch/click state
  const buttonRef = useRef({
    isPressed: false,
    hasPlayedNote: false
  });

  const playNote = useCallback(() => {
    if (!isBarFailing && !buttonRef.current.hasPlayedNote) {
      buttonRef.current.hasPlayedNote = true;
      onNotePlay(noteNumber);
    }
  }, [isBarFailing, noteNumber, onNotePlay]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault(); // Prevent double-firing with click
    buttonRef.current.isPressed = true;
    buttonRef.current.hasPlayedNote = false;
    playNote();
  }, [playNote]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    buttonRef.current.isPressed = false;
    buttonRef.current.hasPlayedNote = false;
  }, []);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    // Only handle mouse events if not a touch device
    if (e.pointerType !== 'touch') {
      buttonRef.current.isPressed = true;
      buttonRef.current.hasPlayedNote = false;
      playNote();
    }
  }, [playNote]);

  const handleMouseUp = useCallback(() => {
    buttonRef.current.isPressed = false;
    buttonRef.current.hasPlayedNote = false;
  }, []);

  // Pointer leave handler
  const handlePointerLeave = useCallback(() => {
    if (buttonRef.current.isPressed) {
      buttonRef.current.isPressed = false;
      buttonRef.current.hasPlayedNote = false;
    }
  }, []);

  const buttonClass = `cube-button ${color} ${isGameEnded ? 'game-ended' : ''} ${
    buttonRef.current.isPressed ? 'pressed' : ''
  }`;

  return (
    <div 
      className={buttonClass}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onPointerLeave={handlePointerLeave}
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