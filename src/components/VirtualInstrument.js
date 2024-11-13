import React from 'react';
import CubeButton from './CubeButton';

const VirtualInstrument = ({ notes, isFlipped, onNotePlay, isGameEnded, isBarFailing }) => {
  return (
    <div className="virtual-instrument">
      {notes.map((note) => (
        <CubeButton
        key={note.id}
        color={note.color}
        frontImage={`/assets/images/cube-fronts/n${note.id}.svg`}
        topImage={`/assets/images/cube-tops/n${note.id}top.svg`}
        bottomImage={`/assets/images/cube-bottoms/${note.id}.svg`}
        noteNumber={note.noteNumber}
        onNotePlay={onNotePlay}
        isFlipped={isFlipped}
        isGameEnded={isGameEnded}
        isBarFailing={isBarFailing}
      />
      ))}
    </div>
  );
};

export default VirtualInstrument;