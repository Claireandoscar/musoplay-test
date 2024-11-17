import React from 'react';

const Controls = ({
  onListenPractice,
  onPerform,
  isListenPracticeMode,
  isPerformAvailable,
  isAudioLoaded,
  gamePhase
}) => {
  console.log({
    isListenPracticeMode,
    isPerformAvailable,
    isAudioLoaded,
    gamePhase
  });

  return (
    <div className="controls-container">
      <button
        className={`control-button listen-practice ${isListenPracticeMode ? 'active' : ''}`}
        onClick={onListenPractice}
        disabled={!isAudioLoaded || gamePhase === 'perform'}
        style={{ 
          backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/ui/listen-practice.svg)`
        }}
      >
        <span className="visually-hidden">Listen & Practice</span>
      </button>
      
      <button
        className={`control-button perform ${gamePhase === 'perform' ? 'active' : ''}`}
        onClick={onPerform}
        disabled={!isListenPracticeMode}
        style={{ 
          backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/ui/perform.svg)`
        }}
      >
        <span className="visually-hidden">Perform</span>
      </button>
    </div>
  );
};

export default Controls;