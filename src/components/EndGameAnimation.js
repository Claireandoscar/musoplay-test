import React, { useEffect, useState, useCallback } from 'react';
import './EndGameAnimation.css';

const EndGameAnimation = ({ score, barHearts, onNext, currentGameNumber }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const [showText, setShowText] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  // Wrap getGameMessage in useCallback
  const getGameMessage = useCallback(() => {
    switch(currentGameNumber) {
      case 1:
        return "great start!\nlet's try something trickier";
      case 2:
        return "well done!\none more challenge to go";
      case 3:
        return "congratulations!\nyou've completed all games";
      default:
        return "well done!";
    }
  }, [currentGameNumber]);

  const getScoringPhrase = (score) => {
    if (score === 16) return "pitch perfect";
    if (score === 15) return "musical genius";
    if (score === 14) return "melody master";
    if (score === 13) return "note ninja";
    if (score === 12) return "harmony hero";
    if (score === 11) return "tune titan";
    if (score === 10) return "melody maker";
    if (score === 9) return "note navigator";
    if (score === 8) return "pitch pioneer";
    return "getting there!";
  };

  useEffect(() => {
    const message = getGameMessage();
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
            <div className="typed-message">
              {typedText.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <img 
              src="/assets/images/ui/next.svg" 
              alt="Next" 
              className="next-button"
              onClick={onNext}
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