import React from 'react';
import './TestButton.css';

function TestButton({ onClick, isDisabled, isTestMode }) {  // Added isTestMode prop
  return (
    <button 
      className={`test-button ${isDisabled ? 'disabled' : ''} ${isTestMode ? 'active' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      <img 
        src={isTestMode ? "/assets/images/ui/test-active.svg" : "/assets/images/ui/test.svg"} 
        alt={isTestMode ? "Exit Test Mode" : "Enter Test Mode"} 
      />
    </button>
  );
}

export default TestButton;