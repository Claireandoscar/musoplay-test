import React from 'react';
import './Toolbar.css';

const Toolbar = ({ onShowInstructions }) => {
  const handleClick = () => {
    console.log('Help button clicked');  // Debug log
    onShowInstructions();
  };

  return (
    <div className="toolbar">
      <button 
        className="help-button" 
        onClick={handleClick}
        aria-label="Show instructions"
      >
        ?
      </button>
      <img 
        src="/assets/images/ui/logo.svg" 
        alt="Musoplay Logo" 
        className="toolbar-logo"
      />
    </div>
  );
};

export default Toolbar;