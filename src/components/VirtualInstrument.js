import React from 'react';
import CubeButton from './CubeButton';

const VirtualInstrument = ({ 
  notes, 
  onNotePlay, 
  isGameEnded, 
  isBarFailing, 
  showFirstNoteHint,
  correctSequence,
  currentBarIndex
}) => {
  // Get the first note number from the current sequence if available
  const firstNoteNumber = correctSequence[currentBarIndex]?.[0]?.number;

  return (
    <div className="virtual-instrument">
      {notes.map((note) => (
        <CubeButton
          key={note.id}
          color={note.color}
          frontImage={`/assets/images/cube-fronts/n${note.id}.svg`}
          bottomImage={`/assets/images/cube-bottoms/${note.id}.svg`}
          noteNumber={note.noteNumber}
          onNotePlay={onNotePlay}
          isGameEnded={isGameEnded}
          isBarFailing={isBarFailing}
          showHint={showFirstNoteHint && note.noteNumber === firstNoteNumber}
        />
      ))}
    </div>
  );
};

export default VirtualInstrument;