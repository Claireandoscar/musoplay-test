import React, { useState } from 'react';
import './StartScreen.css';

const StartScreen = ({ onStartGame }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const handleTodaysGameClick = () => {
    setShowInstructions(true);
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    onStartGame();
  };

  return (
    <div className="start-screen">
      <img 
        src="/assets/images/ui/logo.svg" 
        alt="Musoplay Logo" 
        className="logo"
      />
      <div className="tagline">THE DAILY PUZZLE GAME</div>
      <button className="start-button" onClick={handleTodaysGameClick}>
        <img src="/assets/images/ui/n7.svg" alt="Start Game" />
        <span>TODAY'S MUSOPLAY</span>
      </button>
      <button className="instructions-button" onClick={() => setShowInstructions(false)}>
        <img src="/assets/images/ui/n5.svg" alt="Trivia" />
        <span>DAILY MUSOPLAY TRIVIA</span>
      </button>

      {showInstructions && (
        <div className="instructions-popup">
          <button className="close-button" onClick={handleCloseInstructions}>
            ×
          </button>
          <div className="instructions-content">
            <h2>HOW TO PLAY MUSOPLAY</h2>
            <div className="instruction-item">
              <img src="/assets/images/ui/play.svg" alt="Play icon" />
              <p>listen closely: press play to hear the melody</p>
            </div>
            <div className="instruction-item">
              <img src="/assets/images/ui/n7.svg" alt="N7 icon" />
              <p>recreate the melody: use the virtual keys</p>
            </div>
            <div className="instruction-item">
              <img src="/assets/images/ui/test.svg" alt="Test icon" />
              <p>practice: press "TEST" once per round</p>
            </div>
            <div className="instruction-item">
              <img src="/assets/images/ui/heart.svg" alt="Heart icon" />
              <p>hang on to your hearts!</p>
            </div>
            <p className="challenge">CAN YOU HIT THE RIGHT NOTES?</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;