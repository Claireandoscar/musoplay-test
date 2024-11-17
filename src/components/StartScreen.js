import React, { useState } from 'react';
import './StartScreen.css';

const StartScreen = ({ onStartGame }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  const handleStartClick = () => {
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
      <button className="start-button" onClick={handleStartClick}>
        <img src="/assets/images/ui/n7.svg" alt="Start Game" />
        <span>START</span>
      </button>
      
      <div className="testing-info">
        <p>You're invited to participate in the testing of Musoplay. Your feedback will help improve the experience for future Musoplayers.</p>
        <p>After 3 short games you'll be asked to complete a short survey about your experience.</p>
      </div>

      {showInstructions && (
        <div className="instructions-popup">
          <button className="close-button" onClick={handleCloseInstructions}>
            ×
          </button>
          <div className="instructions-content">
            <h2>HOW TO PLAY</h2>
            <div className="instruction-flow">
              <p>
                Press <img 
                  src="/assets/images/ui/listen-practice.svg" 
                  alt="Listen & Practice" 
                  className="inline-button large"
                /> to hear the melody, try to find the right notes using the virtual instrument, then when you're ready press <img 
                  src="/assets/images/ui/perform.svg" 
                  alt="Perform" 
                  className="inline-button small"
                /> to play the melody for real, but be careful you could lose a <img 
                  src="/assets/images/ui/heart.svg" 
                  alt="Heart" 
                  className="inline-icon"
                /> if you make a mistake!
              </p>
            </div>
            <p className="challenge">CAN YOU HIT THE RIGHT NOTES?</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;