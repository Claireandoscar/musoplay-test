import React from 'react';
import ListenButton from './ListenButton';
import PracticeButton from './PracticeButton';
import PerformButton from './PerformButton';

const Controls = ({ 
  onListen,
  onPractice,
  onPerform,
  isListenAnimated,
  isPracticeAvailable,
  isPerformAvailable,
  isAudioLoaded
}) => {
  return (
    <div className="button-container">
      <PracticeButton 
        onClick={onPractice}
        isAvailable={isPracticeAvailable}
      />
      <ListenButton 
        onClick={onListen}
        isAnimated={isListenAnimated}
        disabled={!isAudioLoaded}
      />
      <PerformButton 
        onClick={onPerform}
        isAvailable={isPerformAvailable}
      />
    </div>
  );
};

export default Controls;