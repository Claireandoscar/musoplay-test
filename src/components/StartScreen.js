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
      <div className="tagline">THE DAILY MUSIC GAME</div>
      <button className="start-button" onClick={handleTodaysGameClick}>
        <img src="/assets/images/ui/n7.svg" alt="Start Game" />
        <span>TODAY'S MUSOPLAY</span>
      </button>
      <button className="instructions-button" onClick={() => setShowInstructions(false)}>
        <img src="/assets/images/ui/n6.svg" alt="Trivia" />
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
              <img src="/assets/images/ui/listen.svg" alt="Play icon" />
              <p>listen closely: press listen to hear the melody</p>
            </div>
            <div className="instruction-item">
              <img src="/assets/images/ui/practice.svg" alt="Practice icon" />
              <p>practice the melody on the virtual keys</p>
            </div>
            <div className="instruction-item">
              <img src="/assets/images/ui/perform.svg" alt="Perform icon" />
              <p>perform the melody on the virtual keys</p>
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