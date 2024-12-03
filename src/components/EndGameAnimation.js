import React, { useEffect, useState, useCallback } from 'react';
import './EndGameAnimation.css';

const EndGameAnimation = ({ score, barHearts, onNext, currentGameNumber }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showText, setShowText] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  const handleNextClick = () => {
    if (currentGameNumber === 3) {
      // Redirect to survey after the third game
      window.location.href = "https://www.surveymonkey.com/r/musoplaysurvey1";
    } else {
      onNext();
    }
  };

  // Combined message and styling information
  const getGameMessage = useCallback(() => {
    switch(currentGameNumber) {
      case 1:
        return {
          text: "WELL DONE\nNOW FOR SOMETHING TRICKIER!",
          color: "#FF8A20",
          nextButton: "/assets/images/ui/next-orange.svg"
        };
      case 2:
        return {
          text: "WARNING!\nEXTRA HARD CHALLENGE AHEAD",
          color: "#FF2376",
          nextButton: "/assets/images/ui/next-pink.svg"
        };
      case 3:
        return {
          text: "THANK YOU FOR YOUR TIME!\nPRESS NEXT TO ACCESS THE SURVEY",
          color: "#00C22D",
          nextButton: "/assets/images/ui/next.svg"
        };
      default:
        return {
          text: "well done!",
          color: "#FFFFFF",
          nextButton: "/assets/images/ui/next.svg"
        };
    }
  }, [currentGameNumber]);

  // ... rest of your existing component code stays the same ...

  return (
    <div className="end-game-animation">
      <div className="animation-content">
        {showText && (
          <>
            <h2 className="scoring-phrase">{getScoringPhrase(score)}</h2>
            <div className="score-display">
              score: {score}/16
            </div>
          </>
        )}
        <div className="hearts-display">
          {barHearts.map((hearts, index) => (
            <div key={index} className={`bar-hearts ${animationStage > index ? 'visible' : ''}`}>
              {[...Array(4)].map((_, i) => (
                <img 
                  key={i}
                  src={`/assets/images/ui/${i < hearts ? 'heart.svg' : 'heart-empty.svg'}`}
                  alt={i < hearts ? "Full Heart" : "Empty Heart"}
                  className="heart-image"
                />
              ))}
            </div>
          ))}
        </div>
        {showText && (
          <>
            <div 
              className="typed-message"
              style={{ color: currentGameStyle.color }}
            >
              {typedText.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <img 
              src={currentGameStyle.nextButton}
              alt="Next" 
              className="end-animation-next-button"
              onClick={handleNextClick}
              style={{ cursor: 'pointer' }}
            />
            <img 
              src={process.env.PUBLIC_URL + '/assets/images/ui/logo.svg'} 
              alt="Musoplay" 
              className="logo" 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EndGameAnimation;