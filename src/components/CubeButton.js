import React from 'react';
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
  const handleClick = () => {
    if (!isBarFailing) {  // Only trigger if not failing
      onNotePlay(noteNumber);
    }
  };

  const buttonClass = `cube-button ${color} ${isGameEnded ? 'game-ended' : ''}`;

  return (
    <div className={buttonClass} onClick={handleClick}>
      <div className="cube-face front">
        <img src={frontImage} alt={`Note ${noteNumber} front`} className="cube-image" />
      </div>
      <div className="cube-face bottom">
        <img src={bottomImage} alt={`Note ${noteNumber} bottom`} className="cube-image" />
      </div>
    </div>
  );
};

export default CubeButton;