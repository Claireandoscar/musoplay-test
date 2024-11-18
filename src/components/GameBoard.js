import React from 'react';
import LifeIndicator from './LifeIndicator';
import Bar from './Bar';  // Import the new unified Bar component

const GameBoard = ({ barHearts, currentBarIndex, renderBar, isBarFailed, gamePhase }) => {  
  // Update renderBar function to use bar number
  const renderBarComponent = (barNumber) => {
    return (
      <Bar 
        key={barNumber}
        barNumber={barNumber}
        isActive={currentBarIndex === barNumber - 1}
        sequence={renderBar.correctSequence[barNumber - 1] || []}
        currentNoteIndex={currentBarIndex === barNumber - 1 ? renderBar.currentNoteIndex : 0}
        isBarComplete={renderBar.completedBars[barNumber - 1]}
        isGameComplete={renderBar.isGameComplete}
        isBarFailing={isBarFailed}
        hasFailed={renderBar.failedBars[barNumber - 1]}
        gamePhase={gamePhase}
      />
    );
  };

  return (
    <>
      <div className="lives-container">
        <LifeIndicator hearts={barHearts[currentBarIndex]} isBarFailed={isBarFailed} />
      </div>
      <div className="bars-container">
        {[1, 2, 3, 4].map(barNumber => renderBarComponent(barNumber))}
      </div>
    </>
  );
};

export default GameBoard;