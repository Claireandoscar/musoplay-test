import React, { useEffect, useState, useCallback } from 'react';
import './EndGameAnimation.css';

const EndGameAnimation = ({ score, barHearts, onNext, currentGameNumber }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showText, setShowText] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  const handleNextClick = () => {
    if (currentGameNumber === 3) {
      console.log('All games completed');
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
          text: "WOW, THAT WAS A TOUGH LEVEL!\nSEE YOU IN APRIL!",
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

  const getScoringPhrase = (score) => {
    if (score === 16) return "Legendary";
    if (score === 15) return "Outstanding";
    if (score === 14) return "Brilliant";
    if (score === 13) return "Impressive";
    if (score === 12) return "Fantastic";
    if (score === 11) return "Well Done";
    if (score === 10) return "Great Job";
    if (score === 9) return "Nice Work";
    if (score === 8) return "Good Try";
  };

  useEffect(() => {
    const message = getGameMessage().text;
    if (showText && typedText.length < message.length) {
      const timer = setTimeout(() => {
        setTypedText(message.slice(0, typedText.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showText, typedText, getGameMessage]);

  useEffect(() => {
    const heartAnimationDuration = 300;
    const totalHeartAnimationTime = heartAnimationDuration * 4;

    const timer = setTimeout(() => {
      if (animationStage < 4) {
        setAnimationStage(prev => prev + 1);
      } else if (animationStage === 4) {
        setShowText(true);
      }
    }, animationStage < 4 ? heartAnimationDuration : totalHeartAnimationTime);

    return () => {
      clearTimeout(timer);
    };
  }, [animationStage]);

  const currentGameStyle = getGameMessage();

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
            {currentGameNumber < 3 && (
              <img 
                src={currentGameStyle.nextButton}
                alt="Next" 
                className="end-animation-next-button"
                onClick={handleNextClick}
                style={{ cursor: 'pointer' }}
              />
            )}
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