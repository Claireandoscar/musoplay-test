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
        <div className="instructions-popup">
          <div className="instructions-content">
            <h2>HOW TO PLAY</h2>
            <div className="instruction-flow">
            <p>
  1. PRESS LISTEN & PRACTICE<br/>
  2. FIND THE NOTES YOU HEAR<br/>
  3. PRACTICE AS MUCH AS YOU NEED<br/>
  4. PRESS PERFORM WHEN READY<br/>
  5. CAREFUL - MISTAKES COST HEARTS!
</p>
            </div>
            <p className="challenge">CAN YOU HIT THE RIGHT NOTES?</p>
            <button className="next-button instructions-next" onClick={handleCloseInstructions}>
              <img src="/assets/images/ui/next.svg" alt="Next" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;