import React from 'react';
import './PlayButton.css';

const PlayButton = ({ onClick, currentBarIndex, isAnimated, isTestMode }) => {  // Added isTestMode prop
  const handleClick = () => {
    onClick();
  };

  return (
    <button 
      className={`play-button ${isAnimated ? 'animated' : ''} ${isTestMode ? 'test-mode' : ''}`} 
      onClick={handleClick}
    >
      <img 
        src="/assets/images/ui/play.svg" 
        alt={isTestMode ? "Play Melody" : `Play Bar ${currentBarIndex + 1}`} 
      />
    </button>
  );
};

export default PlayButton;