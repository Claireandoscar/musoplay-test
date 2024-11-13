import React from 'react';
import TestButton from './TestButton';
import PlayButton from './PlayButton';

const Controls = ({ 
  onTest, 
  onPlay, 
  isTestButtonUsed, 
  isTestButtonAvailable,  // New prop
  currentBarIndex, 
  isAudioLoaded, 
  isPlayButtonAnimated 
}) => {
  return (
    <div className="button-container">
      <TestButton 
        onClick={onTest} 
        isDisabled={!isTestButtonAvailable || isTestButtonUsed}  // Updated condition
      />
      <PlayButton 
        onClick={onPlay}
        currentBarIndex={currentBarIndex}
        isAudioLoaded={isAudioLoaded}
        isAnimated={isPlayButtonAnimated}
      />
    </div>
  );
};

export default Controls;