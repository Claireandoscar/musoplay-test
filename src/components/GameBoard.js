import React from 'react';
import LifeIndicator from './LifeIndicator';
import Bar1 from './Bar1';
import Bar2 from './Bar2';
import Bar3 from './Bar3';
import Bar4 from './Bar4';

const GameBoard = ({ barHearts, currentBarIndex, renderBar, isBarFailed }) => {  // Add isBarFailed here
  return (
    <>
      <div className="lives-container">
        <LifeIndicator hearts={barHearts[currentBarIndex]} isBarFailed={isBarFailed} />
      </div>
      <div className="bars-container">
        {renderBar(Bar1, 0)}
        {renderBar(Bar2, 1)}
        {renderBar(Bar3, 2)}
        {renderBar(Bar4, 3)}
      </div>
    </>
  );
};

export default GameBoard;