import React from 'react';
import LifeIndicator from './LifeIndicator';
import Bar from './Bar';

const GameBoard = ({ 
  barHearts, 
  currentBarIndex, 
  renderBar, 
  isBarFailed, 
  gamePhase 
}) => {  
  // Debug logging to track props
  console.log('GameBoard Render:', {
    currentBarIndex,
    gamePhase,
    correctSequence: renderBar?.correctSequence,
    completedBars: renderBar?.completedBars,
    currentNoteIndex: renderBar?.currentNoteIndex,
    failedBars: renderBar?.failedBars  // Add this line to debug
  });

  const renderBarComponent = (barNumber) => {
    const barIndex = barNumber - 1;
    const isCurrentBar = currentBarIndex === barIndex;
    
    // Debug logging for each bar
    console.log(`Bar ${barNumber} rendering:`, {
      sequence: renderBar?.correctSequence?.[barIndex],
      currentNoteIndex: isCurrentBar ? renderBar?.currentNoteIndex : 0,
      isComplete: renderBar?.completedBars?.[barIndex],
      isFailing: isBarFailed && isCurrentBar,
      hasFailed: renderBar?.failedBars?.[barIndex]  // Add this line to debug
    });

    return (
      <Bar 
        key={barNumber}
        barNumber={barNumber}
        isActive={isCurrentBar}
        sequence={renderBar?.correctSequence?.[barIndex] || []}
        currentNoteIndex={isCurrentBar ? renderBar?.currentNoteIndex : 0}
        isBarComplete={renderBar?.completedBars?.[barIndex] || false}
        isGameComplete={renderBar?.isGameComplete || false}
        isBarFailing={isBarFailed && isCurrentBar}
        hasFailed={renderBar?.failedBars?.[barIndex]}  // Updated this line
        gamePhase={gamePhase}
      />
    );
  };

  // Early return if essential props are missing
  if (!renderBar?.correctSequence) {
    console.warn('GameBoard: Missing correct sequence data');
    return (
      <div className="bars-container">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="lives-container">
        <LifeIndicator 
          hearts={barHearts[currentBarIndex] || 0} 
          isBarFailed={isBarFailed} 
        />
      </div>
      <div className="bars-container">
        {[1, 2, 3, 4].map(barNumber => renderBarComponent(barNumber))}
      </div>
    </>
  );
};

export default GameBoard;