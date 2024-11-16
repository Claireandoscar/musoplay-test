import React from 'react';
import CubeButton from './CubeButton';

const VirtualInstrument = ({ notes, onNotePlay, isGameEnded, isBarFailing }) => {
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
        />
      ))}
    </div>
  );
};

export default VirtualInstrument;