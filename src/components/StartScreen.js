import React, { useState } from 'react';
import './StartScreen.css';

const StartScreen = ({ onStartGame }) => {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showStartButton, setShowStartButton] = useState(false);
  
  const infoBlocks = [
    "WELCOME TO MUSOPLAY TESTING!",
    "THANK YOU FOR TAKING PART!",
    "TODAY'S TEST VERSION HAS THREE CHALLENGES AT DIFFERENT DIFFICULTY LEVELS",
    "YOUR PREFERENCES WILL GUIDE MUSOPLAY'S FUTURE DEVELOPMENT",
    "PLEASE SHARE YOUR THOUGHTS IN A QUICK SURVEY AFTER"
  ];

  const handleNext = () => {
    setIsFlipping(true);
    setTimeout(() => {
      if (currentBlock === infoBlocks.length - 1) {
        setShowStartButton(true);
      } else {
        setCurrentBlock(prev => prev + 1);
      }
      setIsFlipping(false);
    }, 500);
  };

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
      
      {!showStartButton && (
        <>
          <div className={`testing-info ${isFlipping ? 'flipping' : ''}`}>
            <p>{infoBlocks[currentBlock]}</p>
          </div>
          <button className="next-button" onClick={handleNext}>
            <img src="/assets/images/ui/next.svg" alt="Next" />
          </button>
        </>
      )}

      {showStartButton && (
        <div className="central-button-container">
          <button className="start-button active" onClick={handleStartClick}>
            <img src="/assets/images/ui/n7.svg" alt="Start Game" />
            <span>START</span>
          </button>
        </div>
      )}

      {showInstructions && (
        <div className="instructions-popup" onClick={handleCloseInstructions}>
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